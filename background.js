import OBR from "@owlbear-rodeo/sdk";

const METADATA_ID = "com.tactile-tabletop.metadata";
const SHIELD_ID = "tactile-tabletop-shield";

/**
 * Background script runs globally in the OBR room.
 * It manages the Glass Pane injection into the main window.
 */
OBR.onReady(async () => {
  console.log("Tactile Tabletop: Background script successfully connected.");

  const applyShield = (isTabletop) => {
    // Note: Background scripts in OBR interact with the OBR site's DOM
    // We check if the shield exists in the document where the script is running
    let shield = document.getElementById(SHIELD_ID);

    if (isTabletop) {
      if (!shield) {
        shield = document.createElement("div");
        shield.id = SHIELD_ID;
        Object.assign(shield.style, {
          position: "fixed",
          top: "0",
          left: "0",
          width: "100vw",
          height: "100vh",
          zIndex: "2147483647", // Max possible z-index
          backgroundColor: "rgba(0,0,0,0)",
          pointerEvents: "all",
          cursor: "crosshair"
        });
        
        // Prevent accidental right-clicks/context menus
        shield.addEventListener('contextmenu', e => e.preventDefault());
        
        document.body.appendChild(shield);
        console.log("Tactile Tabletop: SHIELD INJECTED.");
      }
    } else {
      if (shield) {
        shield.remove();
        console.log("Tactile Tabletop: SHIELD REMOVED.");
      }
    }
  };

  // Initial check on load
  const myId = await OBR.player.getId();
  const metadata = await OBR.room.getMetadata();
  const tabletopData = metadata[METADATA_ID] || {};
  applyShield(tabletopData[myId] === true);

  // Watch for the DM toggling the role
  OBR.room.onMetadataChange((metadata) => {
    const tabletopData = metadata[METADATA_ID] || {};
    applyShield(tabletopData[myId] === true);
  });
});