const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

class LuaIO {
    constructor() {
        this.fileHandles = new Map();
        this.filePath = new Map();
        this.processData = new Map();
        this.nextHandle = 1;
    }

    modeConvert(mode) {
        // 遍历模式字符串，转换为 fs 模式
        let fsMode = fs.constants.O_RDONLY;
        for (let i = 0; i < mode.length; i++) {
            switch (mode[i]) {
                case 'r':
                    fsMode |= fs.constants.O_RDONLY;
                    break;
                case 'w':
                    fsMode |= fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_TRUNC;
                    break;
                case 'a':
                    fsMode |= fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_APPEND;
                    break;
                case '+':
                    fsMode |= fs.constants.O_RDWR;
                    break;
                case 'b':
                    break;
                default:
                    break;
            }
        }
        return fsMode;
    }

    open(filename, mode) {
        try {
            mode = this.modeConvert(mode);
            const handle = this.nextHandle++;
            const fd = fs.openSync(filename, mode);
            this.fileHandles.set(handle, fd);
            this.filePath.set(handle, filename);
            return handle;
        } catch (err) {
            if (err.code != 'ENOENT') {
                console.error(err);
            }
            return null;
        }
    }

    close(handle) {
        if (this.fileHandles.has(handle)) {
            const fd = this.fileHandles.get(handle);
            fs.closeSync(fd);
            this.fileHandles.delete(handle);
            return true;
        }
        return false;
    }

    read(handle, format, ...args) {
        if (!this.fileHandles.has(handle)) return null;

        const fd = this.fileHandles.get(handle);
        const buffer = Buffer.alloc(1024);
        if (format === '*a' || format === '*all') {
            if (this.filePath.has(handle)) {
                let path = this.filePath.get(handle);
                let data = fs.readFileSync(path, 'hex');
                return 'hex:' + data;
            } else if (this.processData.has(handle)) {
                return this.processData.get(handle).stdout;
            } else {
                let bytesRead = fs.readSync(fd, buffer, 0, buffer.length, null);
                return buffer.toString('utf8', 0, bytesRead);
            }
        } else if (format === '*l' || format === '*line' || format === 'l') {
            const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, null);
            const line = buffer.toString('utf8', 0, bytesRead).split('\n')[0];
            return line;
        } else if (format === '*n' || format === '*number' || format === 'n') {
            const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, null);
            const number = parseFloat(buffer.toString('utf8', 0, bytesRead));
            return number;
        } else if (typeof format === 'number') {
            const bytesRead = fs.readSync(fd, buffer, 0, format, null);
            return buffer.toString('utf8', 0, bytesRead);
        }
        return null;
    }

    write(handle, ...args) {
        if (!this.fileHandles.has(handle)) return false;

        const fd = this.fileHandles.get(handle);
        const data = args.join(' ');
        if (data.substring(0, 4) == 'hex:') {
            let buffer = Buffer.from(data.substring(4), 'hex');
            fs.writeSync(fd, buffer);
            return true;
        }
        fs.writeSync(fd, data);
        return true;
    }

    seek(handle, whence, offset) {
        if (!this.fileHandles.has(handle)) return null;

        const fd = this.fileHandles.get(handle);
        let position;

        if (whence === 'set') {
            position = offset;
        } else if (whence === 'cur') {
            position = fs.fstatSync(fd).size + offset;
        } else if (whence === 'end') {
            position = fs.fstatSync(fd).size - offset;
        }

        fs.readSync(fd, Buffer.alloc(0), 0, 0, position);
        return position;
    }

    input(handle) {
        if (handle === undefined) {
            return this.currentInputHandle;
        } else if (this.fileHandles.has(handle)) {
            this.currentInputHandle = handle;
            return handle;
        }
        return null;
    }

    output(handle) {
        if (handle === undefined) {
            return this.currentOutputHandle;
        } else if (this.fileHandles.has(handle)) {
            this.currentOutputHandle = handle;
            return handle;
        }
        return null;
    }

    lines(filename) {
        const handle = this.open(filename, 'r');
        if (!handle) return null;

        const lines = [];
        let line;
        while ((line = this.read(handle, '*l')) !== null) {
            lines.push(line);
        }
        this.close(handle);
        return lines;
    }

    flush(handle) {
        if (!this.fileHandles.has(handle)) return false;

        const fd = this.fileHandles.get(handle);
        fs.fsyncSync(fd);
        return true;
    }

    tmpfile() {
        const tmpDir = require('os').tmpdir();
        const tmpFilePath = path.join(tmpDir, `tempfile_${Date.now()}`);
        const handle = this.open(tmpFilePath, 'w+');
        return handle;
    }

    type(obj) {
        if (this.fileHandles.has(obj)) {
            return 'file';
        }
        return null;
    }

    popen(command, mode) {
        let data;
        try {
            data = execSync(command).toString();
        } catch (err) {
            data = '';
            // ignore "is not recognized" error
            if (!err.message.includes('is not recognized')) {
                console.error(err);
            }
        }
        const handle = this.nextHandle++;
        this.fileHandles.set(handle, data);
        this.processData.set(handle, {
            stdout: data,
            stderr: ''
        });
        return handle;
    }
}

let luaIO = new LuaIO();

exports('GetIoLib', () => {
    return {
        open: (_, filename, mode) => {
            let handle = luaIO.open(filename, mode);
            return handle;
        },
        close: (_, handle) => {
            return luaIO.close(handle);
        },
        read: (handle, format, ...args) => {
            return luaIO.read(handle, format, ...args);
        },
        write: (handle, ...args) => {
            return luaIO.write(handle, ...args);
        },
        seek: (handle, whence, offset) => {
            return luaIO.seek(handle, whence, offset);
        },
        input: (handle) => {
            return luaIO.input(handle);
        },
        output: (handle) => {
            return luaIO.output(handle);
        },
        lines: (filename) => {
            return luaIO.lines(filename);
        },
        flush: (handle) => {
            return luaIO.flush(handle);
        },
        tmpfile: () => {
            return luaIO.tmpfile();
        },
        type: (obj) => {
            return luaIO.type(obj);
        },
        popen: (command, mode) => {
            console.log('libpopen', command, mode);
            return luaIO.popen(command, mode);
        }
    }
});