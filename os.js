class LuaOS {
    execute(command) {
        return spawn(command, { shell: true, stdio: ['pipe', 'pipe', 'pipe'] });
    }

    getenv(varname) {
        return process.env[varname] || null;
    }

    remove(file) {
        fs.unlinkSync(file);
    }

    rename(oldname, newname) {
        fs.renameSync(oldname, newname);
    }

    setlocale(locale) {
        return null;
    }

    time() {
        return Math.floor(Date.now() / 1000);
    }

    tmpname() {
        return null;
    }
}

let luaOS = new LuaOS();

exports('GetOsLib', () => {
    return {
        execute: (command) => {
            return luaOS.execute(command);
        },
        getenv: (varname) => {
            return luaOS.getenv(varname);
        },
        remove: (file) => {
            luaOS.remove(file);
        },
        rename: (oldname, newname) => {
            luaOS.rename(oldname, newname);
        },
        setlocale: (locale) => {
            return luaOS.setlocale(locale);
        },
        time: () => {
            return luaOS.time();
        },
        tmpname: () => {
            return luaOS.tmpname();
        }
    }
});