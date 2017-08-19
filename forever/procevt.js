const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

class Process extends EventEmitter {
    constructor() {
        super();
    }
}

class ProcEvents extends EventEmitter {
    constructor() {
        super();
        this.cache = {};
        this.init = 2;
        this.interval = 0;
        this.setMaxListeners(32);
    }
    start() {
        this.interval = setInterval(this.update.bind(this), 1000);
    }
    stop() {
        clearInterval(this.interval);
    }
    storeProcessData(pid) {
        var self = this;
        fs.readFile(`/proc/${pid}/status`, function(err, data) {
            if (err) {
                return;
                console.log(err);
            };
            var proc = { pid: pid, name: '', uid: '' };
            var lines = data.toString().split('\n');
            lines.forEach(function(line) {
                var match_name = /Name:\t(.+)$/i.exec(line);
                var match_uid = /Uid:\t\d+\t(\d+)/.exec(line);
                if (match_name) proc.name = match_name[1];
                if (match_uid) proc.uid = match_uid[1];
            });
            self.cache[pid] = proc;
            if (!self.init) {
                //console.log(`Process ${JSON.stringify(proc)} spawned`);
                self.emit('birth', proc);
            }
        });
    }
    checkProcess(pid) {
        var self = this;
        fs.stat(`/proc/${pid}`, function(err, stat) {
            if (err) {
                //console.log(`Process ${JSON.stringify(self.cache[pid])} died!`);
                self.emit('death', self.cache[pid]);
                delete self.cache[pid];
            }
        });
    }
    update() {
        var self = this;
        if (this.init) {
            if (!--this.init) {
                self.emit('init');
            }
        };
        // Discard old processes
        for (var key in self.cache) {
            this.checkProcess(key);
        }
        // Check for new processes
        fs.readdir('/proc', function(err, files) {
            if (err) return;
            files.forEach(function(file) {
                var pid = file;
                if (self.cache[pid]) {
                    return;
                }
                if (/^\d+$/.test(file)) {
                    file = path.resolve('/proc', file);
                    fs.stat(file, function(err, stats) {
                        if (err) return;
                        if (stats.isDirectory()) {
                            self.storeProcessData(pid);
                        }
                    });
                }
            });
            self.emit('update');
        });
    }
    find(name, uid) {
        var self = this;
        var result = [];
        for (var key in self.cache) {
            if (self.cache[key].uid == uid && self.cache[key].name == name) {
                result.push(key);
            }
        }
        return result;
    }
}

module.exports = new ProcEvents();