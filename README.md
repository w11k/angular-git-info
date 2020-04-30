# @w11k/git-info

This schematic fro the angular-cli let's you easily setup a workflow that allows you to access the git-information in your Angular App.
Read our detailed [blog post](https://www.thecodecampus.de/blog/display-the-version-and-git-hash-in-angular) about the topic.

## Installation

Add this schematic to your project using the `ng add` command
```bash
ng add @w11k/git-info
```

This will setup everything you need. We will automatically
- add required devDependencies to your `package.json`
- add a script `git-version.js` in the same folder where your `package.json` ist
- add a npm `postinstall`-hook to the `scipts` section of your `package.json`
- add the automatically generated file to the `.gitignore`

## Customization

By default the schematic hooks into the `postinstall`-hook that is triggered after `npm install` has finished. 
Typically you would execute a fresh `npm install` on your build server whenever you deploy a new version of your app.
If you however don't do a fresh install every time due to caching for example you can call the postinstall hook manually via 
```bash
npm run postinstall
```
or use another hook like `prebuild` or no hook at all, but just a regular script in the `scripts` section of the `package.json`  

## Usage

After each `npm install` we trigger the npm-hook to update the automatically generated file `environments/version.ts`
This is a normal Typescript file that simply exports a constant. It is very important that this file in not committed to the git-repo.
The file looks similar to this:


```typescript
// IMPORTANT: THIS FILE IS AUTO GENERATED! DO NOT MANUALLY EDIT OR CHECKIN!
/* tslint:disable */
export const VERSION = {
    "dirty": true,
    "raw": "34a0f1d-dirty",
    "hash": "34a0f1d",
    "distance": null,
    "tag": null,
    "semver": null,
    "suffix": "34a0f1d-dirty",
    "semverString": null,
    "version": "0.0.0"
};
/* tslint:enable */
```

To use the generated VERSION you can simply import it in your Angular Components/Services like so
```typescript
import { Component } from '@angular/core';
import { VERSION } from '../environments/version';  

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
  
  constructor() {
    console.log(`Application version is: version (from package.json)=${VERSION.version}, git-tag=${VERSION.tag}, git-hash=${VERSION.hash}`);
  }
}
```

## Acknowledgement
- Idea and Code heavily inspired by this [blog post](https://medium.com/@amcdnl/version-stamping-your-app-with-the-angular-cli-d563284bb94d)
- Angular schematic implementation heavily inspired by [jest-schematic](https://github.com/briebug/jest-schematic)
