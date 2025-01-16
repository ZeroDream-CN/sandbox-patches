# Sandbox Patches
FiveM Lua sandbox IO and OS lib patches

Due to FiveM's inclusion of Lua sandboxing in the latest build, this feature prevents your scripts from using functions such as `io.open`, `io.popen`, and `os.execute`. This script reimplements the io and os libraries using JavaScript, to allow you to utilize the aforementioned functions.

## Installation
Clone this repository into your resources folder.
```bash
git clone https://github.com/ZeroDream-CN/sandbox-patches
```

Add the following to your `server.cfg` file:
```cfg
ensure sandbox-patches
```

**Note:** This resource must be started before any other resources that use the `os` or `io` libraries.

## Usage
Add the following to your resource's `fxmanifest.lua` file:
```lua
server_script '@sandbox-patches/patches.lua'
```
or like this:
```lua
server_scripts {
    '@sandbox-patches/patches.lua',
    'server.lua' -- your other server scripts
}
```
Then you can use `io` and `os` functions as usual.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
