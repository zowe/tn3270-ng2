# TN3270 key sequences feature
1. Define own key sequences in ```_keySequences.json``` 
2. Upload the file to the instance workspace, e.g.: ```zowe/instances/instance1.23.0/workspace/app-server/users/USERID/ZLUX/pluginStorage/org.zowe.terminal.tn3270/sessions```
3. Build and upload the TN3270 to your runtime library
4. Use Key sequences in the terminal

**Note:** known bug: does not work properly for more TN3270 instances - key emulation is dispatched to ```textarea#input``` which is not unique and querySelector is always returning the first DOM element - will be fixed.

![tn3270](https://user-images.githubusercontent.com/66114686/130959163-8803acdb-af44-4b77-81f2-08b98054e3a1.png)

