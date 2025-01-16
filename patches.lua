ioLib = exports['sandbox-patches']:GetIoLib()
osLib = exports['sandbox-patches']:GetOsLib()
ioGlobal = {
    handle = nil,
}

function io.open(path, mode)
    local ioObj = {
        handle = ioLib:open(path, mode),
    }

    function ioObj:close()
        return ioLib.close(self.handle)
    end

    function ioObj:read(mode)
        local data = ioLib.read(self.handle, mode)
        if string.sub(data, 0, 4) == 'hex:' then
            return hexdecode(string.sub(data, 5))
        end
        return data
    end

    function ioObj:write(...)
        local data = ''
        for i = 1, select('#', ...) do
            data = data .. select(i, ...)
        end
        data = hexencode(data)
        return ioLib.write(self.handle, 'hex:' .. data)
    end

    function ioObj:flush()
        return ioLib.flush(self.handle)
    end

    function ioObj:seek(whence, offset)
        return ioLib.seek(self.handle, whence, offset)
    end

    function ioObj:lines()
        return ioLib.lines(self.handle)
    end

    ioGlobal.handle = ioObj.handle
    return ioObj.handle and ioObj or nil
end

function io.close(handle)
    if handle == nil then
        handle = ioGlobal.handle
    end
    ioGlobal.handle = nil
    return ioLib.close(handle)
end

function io.read(mode)
    local data = ioLib.read(ioGlobal.handle, mode)
    if string.sub(data, 0, 4) == 'hex:' then
        return hexdecode(string.sub(data, 5))
    end
    return data
end

function io.write(...)
    local data = ''
    for i = 1, select('#', ...) do
        data = data .. select(i, ...)
    end
    data = hexencode(data)
    return ioLib.write(ioGlobal.handle, 'hex:' .. data)
end

function io.flush()
    return ioLib.flush(ioGlobal.handle)
end

function io.seek(whence, offset)
    return ioLib.seek(ioGlobal.handle, whence, offset)
end

function io.input(file)
    ioGlobal.handle = ioLib.input(file)
end

function io.output(file)
    ioGlobal.handle = ioLib.output(file)
end

function io.lines(file)
    local data = ioLib.lines(file)
    if file ~= nil then
        io.input()
    end
end

function io.tmpfile()
    return ioLib.tmpfile()
end

function io.type(obj)
    return ioLib.type(obj)
end

function io.popen(cmd, mode)
    local ioObj = {
        handle = ioLib.popen(cmd, mode)
    }

    function ioObj:close()
        return ioLib.close(self.handle)
    end

    function ioObj:read(mode)
        local data = ioLib.read(self.handle, mode)
        if string.sub(data, 0, 4) == 'hex:' then
            return hexdecode(string.sub(data, 5))
        end
        return data
    end

    function ioObj:write(...)
        local data = ''
        for i = 1, select('#', ...) do
            data = data .. select(i, ...)
        end
        data = hexencode(data)
        return ioLib.write(self.handle, 'hex:' .. data)
    end

    function ioObj:flush()
        return ioLib.flush(self.handle)
    end

    function ioObj:seek(whence, offset)
        return ioLib.seek(self.handle, whence, offset)
    end

    function ioObj:lines()
        return ioLib.lines(self.handle)
    end

    ioGlobal.handle = ioObj.handle
    return ioObj.handle and ioObj or nil
end

function os.execute(cmd)
    return osLib.execute(cmd)
end

function os.getenv(varname)
    return osLib.getenv(varname)
end

function os.remove(file)
    return osLib.remove(file)
end

function os.rename(old, new)
    return osLib.rename(old, new)
end

function os.tmpname()
    return osLib.tmpname()
end

function os.setlocale(locale, category)
    return osLib.setlocale(locale, category)
end

function hexdecode(hex)
    return (hex:gsub('%x%x', function(cc)
        return string.char(tonumber(cc, 16))
    end))
end

function hexencode(str)
    return (str:gsub('.', function(c)
        return string.format('%02X', string.byte(c))
    end))
end
