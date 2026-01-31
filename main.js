import OBR from "@owlbear-rodeo/sdk";

// This is our main application logic
async function setup() {
  const statusElement = document.getElementById("status");
  const uiRoot = document.getElementById("ui-root");

  console.log("Tactile Tabletop: Script loading...");

  // Wait for the OBR SDK to be ready
  OBR.onReady(async () => {
    console.log("Tactile Tabletop: SDK is ready!");
    
    try {
      const role = await OBR.player.getRole();
      const name = await OBR.player.getName();

      statusElement.innerHTML = `Connected as: <strong>${name}</strong>`;
      
      // Function to render the DM interface
      const renderDMInterface = async () => {
        const players = await OBR.party.getPlayers();
        
        uiRoot.innerHTML = `
          <div class="role-badge">DM View</div>
          <p>Toggle <strong>Tabletop</strong> status for players:</p>
          <ul id="player-list" style="list-style: none; padding: 0; text-align: left;">
            ${players.map(p => {
              // We'll placeholder the 'checked' state for now. 
              // In the next step, we'll pull this from OBR Metadata.
              const isTabletop = false; 
              
              return `
                <li style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; background: #333; padding: 8px; border-radius: 4px;">
                  <span>${p.name}</span>
                  <label class="switch" style="position: relative; display: inline-block; width: 40px; height: 20px;">
                    <input type="checkbox" class="tabletop-toggle" data-id="${p.id}" ${isTabletop ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
                    <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 20px;"></span>
                  </label>
                </li>
              `;
            }).join('')}
          </ul>
          <style>
            .tabletop-toggle:checked + .slider { background-color: #4a90e2; }
            .slider:before {
              position: absolute; content: ""; height: 16px; width: 16px; left: 2px; bottom: 2px;
              background-color: white; transition: .4s; border-radius: 50%;
            }
            .tabletop-toggle:checked + .slider:before { transform: translateX(20px); }
          </style>
          <hr style="border: 0; border-top: 1px solid #444; margin: 15px 0;">
          <button id="test-btn" style="padding: 8px; cursor: pointer; width: 100%;">Ping My Browser</button>
        `;

        // Add change events to the toggles
        document.querySelectorAll('.tabletop-toggle').forEach(toggle => {
          toggle.onchange = (e) => {
            const playerId = toggle.getAttribute('data-id');
            const playerName = players.find(p => p.id === playerId)?.name;
            const isChecked = e.target.checked;
            
            if (isChecked) {
              OBR.notification.show(`${playerName} is now a Tabletop.`);
            } else {
              OBR.notification.show(`${playerName} is no longer a Tabletop.`);
            }
            
            // Logic for saving this persistent state to OBR Metadata will go here next
          };
        });

        document.getElementById("test-btn").onclick = () => {
          OBR.notification.show(`Hello ${name}! The extension is working.`);
        };
      };

      // Basic Role identification logic
      if (role === "GM") {
        await renderDMInterface();
        
        // Update the list whenever the party changes (players join/leave)
        OBR.party.onChange(() => {
          renderDMInterface();
        });

      } else {
        uiRoot.innerHTML = `
          <div class="role-badge">Player View</div>
          <p>Waiting for DM to assign Tabletop role.</p>
        `;
      }
      
    } catch (error) {
      statusElement.innerText = "Error connecting to OBR data.";
      console.error("Tactile Tabletop: SDK Error:", error);
    }
  });
}

// Start the app
setup();