# TN3270 key sequences feature
1. Define own key sequences in ```_keySequences.json``` 
2. Upload the file to the instance workspace, e.g.: ```zowe/instances/instance1.23.0/workspace/app-server/users/USERID/ZLUX/pluginStorage/org.zowe.terminal.tn3270/sessions```
3. Build and upload the TN3270 to your runtime library
4. Use Key sequences in the terminal

## Key sequence config example
```
{
   "keySequences":[
      {
         "title":"Title to be displayed",
         "description":"Description of the command (hover help)",
         "keys":[
            {
               "normal":"NORMAL TEXT"
            },
            {
               "special":"Home or Tab or Enter or F1..."
            },
            {
               "normal":"X",
               "ctrl":"true"
            },
            {
               "prompt":"Enter your name"
            }
         ]
      },
      {
         "title":"HELLO",
         "description":"Types Hello, world!",
         "keys":[
            {
               "normal":"Hello, world!"
            }
         ]
      },
      {
         "title":"Swap next",
         "description":"ISPF: Swap next command",
         "keys":[
            {
               "special":"Home"
            },
            {
               "normal":"E",
               "ctrl":"true"
            },
            {
               "normal":"SWAP NEXT"
            },
            {
               "special":"Enter"
            }
         ]
      }
   ]
}
```

## Latest updates
* Separated connection and key sequnce menu
* Reload button to refresh the key sequences (e.g. if key sequnces config was edited)
* Warning when combination of normal, special and prompt definition used (key action is partially processed)
* Buttons highlighting

![image](https://user-images.githubusercontent.com/66114686/139689329-3ade09ce-fb2a-42cf-a934-66f1d5bd1904.png)


