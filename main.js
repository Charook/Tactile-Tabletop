import OBR from "@owlbear-rodeo/sdk";

// A unique ID for our metadata to avoid clashing with other extensions
const METADATA_ID = "com.tactile-tabletop.metadata";

// CSS for the UI elements in the popover
const styles = `
  .switch { position: relative; display: inline-block; width: 40px; height: 20px; }
  .tabletop-toggle { opacity: 0; width: 0; height: 0; }
  .slider { 
    position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; 
    background-color: #ccc; transition: .4s; border-radius: 20px; 
  }
  .slider:before {
    position: absolute; content: ""; height: 16px; width: 16px; left: 2px; bottom: 2px;
    background-color: white; transition: .4s; border-radius: 50%;
  }
  .tabletop-toggle:checked + .slider { background-color: #4a90e2; }
  .tabletop-toggle:checked + .slider:before { transform: translateX(20px); }
  .role-badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; margin-bottom: 10px; display: inline-block; background: #444; }
  #status { font-size: 0.9em; margin-bottom: 10px; color: #aaa; }
`;

async function setup() {
  const statusElement = document.getElementById("status");
  const uiRoot = document.getElementById("ui-root");

  // Inject styles for the popover UI
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);

  console.log("Tactile Tabletop UI: Initializing...");

  // Safety timeout: If OBR doesn't ready in 5 seconds, inform the user
  const timeoutId = setTimeout(() => {
    if (statusElement.innerText === "Connecting...") {
      statusElement.innerHTML = "<span style='color: #e74c3c;'>Connection Timeout. Check if extension is enabled.</span>";
    }
  }, 5000);

  OBR.onReady(async () => {
    clearTimeout(timeoutId);
    console.log("Tactile Tabletop UI: SDK Ready.");
    
    try {
      const role = await OBR.player.getRole();
      const name = await OBR.player.getName();
      const myId = await OBR.player.getId();

      statusElement.innerHTML = `Connected as: <strong>${name}</strong>`;

      const renderDMInterface = async () => {
        const players = await OBR.party.getPlayers();
        const metadata = await OBR.room.getMetadata();
        const tabletopData = metadata[METADATA_ID] || {};
        
        uiRoot.innerHTML = `
          <div class="role-badge">DM Control Panel</div>
          <p>Toggle <strong>Tabletop Mode</strong>:</p>
          <ul id="player-list" style="list-style: none; padding: 0; text-align: left;">
            ${players.map(p => {
              const isTabletop = tabletopData[p.id] === true; 
              return `
                <li style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; background: #333; padding: 10px; border-radius: 6px;">
                  <span>${p.name}</span>
                  <label class="switch">
                    <input type="checkbox" class="tabletop-toggle" data-id="${p.id}" ${isTabletop ? 'checked' : ''}>
                    <span class="slider"></span>
                  </label>
                </li>
              `;
            }).join('')}
          </ul>
        `;

        document.querySelectorAll('.tabletop-toggle').forEach(toggle => {
          toggle.onchange = async (e) => {
            const playerId = toggle.getAttribute('data-id');
            const isChecked = e.target.checked;
            
            const currentMetadata = await OBR.room.getMetadata();
            const currentTabletopData = currentMetadata[METADATA_ID] || {};
            currentTabletopData[playerId] = isChecked;
            
            await OBR.room.setMetadata({ [METADATA_ID]: currentTabletopData });
            OBR.notification.show(`Tabletop mode ${isChecked ? 'enabled' : 'disabled'} for ${players.find(p => p.id === playerId)?.name}`);
          };
        });
      };

      const renderPlayerInterface = async () => {
        const metadata = await OBR.room.getMetadata();
        const tabletopData = metadata[METADATA_ID] || {};
        const isTabletop = tabletopData[myId] === true;

        if (isTabletop) {
          uiRoot.innerHTML = `
            <div class="role-badge" style="background-color: #e67e22;">TABLETOP MODE ACTIVE</div>
            <p><strong>Shielding enabled.</strong> This browser instance is now the physical interface.</p>
          `;
        } else {
          uiRoot.innerHTML = `
            <div class="role-badge">Player View</div>
            <p>Waiting for DM role assignment.</p>
          `;
        }
      };

      if (role === "GM") {
        await renderDMInterface();
        OBR.party.onChange(renderDMInterface);
        OBR.room.onMetadataChange(renderDMInterface);
      } else {
        await renderPlayerInterface();
        OBR.room.onMetadataChange(renderPlayerInterface);
      }
      
    } catch (error) {
      statusElement.innerText = "Error: " + error.message;
      console.error("Tactile Tabletop: UI Error:", error);
    }
  });
}

setup();