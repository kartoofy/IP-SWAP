# IP-SWAP

A Violentmonkey userscript that adds a **Reset WAN** button to the modem interface. It performs a complete WAN reset in one click so the connection can obtain a new public IP address.

## Compatibility

**This script is strictly intended for the Huawei HG8145X6-10 modem supplied by ALGERIE TELECOM.** It depends on the modem's original interface structure and element IDs, so it is not guaranteed to work with other Huawei models, firmware versions, or internet providers.

## Installation

1. Install [Violentmonkey](https://violentmonkey.github.io/) in your browser.
2. Open `Reset WAN Button (1-click, regrab).user.js`.
3. Create a new Violentmonkey script, paste the file contents, and save it.
4. Log in to the modem at `http://192.168.100.1`.

## Usage

1. Open the modem's web interface while logged in.
2. Click **Reset WAN** next to the configuration guide.
3. The script will:
   - open **Advanced** if the WAN table is not already loaded;
   - open the WAN connection settings;
   - uncheck the WAN switch and apply the change;
   - wait for the modem to return to a fresh WAN table;
   - reopen the connection settings;
   - check the WAN switch and apply it again.
4. Wait for the modem to reconnect and verify the public IP address.

The button can be pressed again whenever another IP reset is needed. The script waits for each page reload to complete instead of relying only on fixed delays, which helps avoid the modem's invalid-token error.

## Notes

- Stay logged in to the modem before using the button.
- Do not use the script on modem models or providers other than the **Huawei HG8145X6-10 from ALGERIE TELECOM**.
- The reset may briefly interrupt the internet connection.

## Disclaimer

Use this script at your own risk. It only automates controls already available in the modem's web interface.
