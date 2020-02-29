const sqlite3 = require('sqlite3')
const fs = require('fs')

async function toSQLite(name) {
    if (! fs.existsSync('output')) {
        fs.mkdirSync('output')
    }
    
    let dbpath = 'output/' + name + '.db'
    if (fs.existsSync(dbpath)) {
        fs.unlinkSync(dbpath)
    }

    console.log('Output to', dbpath)

    let mydb = new sqlite3.Database(dbpath)
    await mydb.run('CREATE TABLE profiles(id TEXT PRIMARY KEY, detail TEXT)')
    await mydb.run('CREATE TABLE conversations(id TEXT PRIMARY KEY, detail TEXT)')
    await mydb.run('CREATE TABLE messages(id1 TEXT, id2 TEXT, detail TEXT)')

    indexedDB.open(name).onsuccess = function(event) {
        var cursor = event.target.result
        var store

        store = cursor.transaction(['conversationsv14'], 'readonly').objectStore('conversationsv14')
        store.openCursor().onsuccess = function(event) {
            let result = event.target.result
            if (result == null) {
                console.log('Done writing conversations')
                return
            }

            if (result.value.conv.lastMessage) {
                mydb.run(`INSERT INTO conversations(id, detail) VALUES(?, ?)`, 
                    [result.key, JSON.stringify(result.value)], 
                    function(err) {
                        if (err) {
                            return console.log(err.message);
                        }
                    })
            }

            result.continue()
        }

        store = cursor.transaction(['profilecachev8'], 'readonly').objectStore('profilecachev8')
        store.openCursor().onsuccess = function(event) {
            let result = event.target.result
            if (result == null) {
                console.log('Done writing profiles')
                return
            }

            mydb.run(`INSERT INTO profiles(id, detail) VALUES(?, ?)`, 
                [result.key, JSON.stringify(result.value)], 
                function(err) {
                    if (err) {
                        return console.log(err.message);
                    }
                })

            result.continue()
        }

        store = cursor.transaction(['messagesv12'], 'readonly').objectStore('messagesv12')
        store.openCursor().onsuccess = function(event) {
            let result = event.target.result
            if (result == null) {
                console.log('Done writing messages')
                return
            }

            mydb.run(`INSERT INTO messages(id1, id2, detail) VALUES(?, ?, ?)`, 
                [result.key[0], result.key[1], JSON.stringify(result.value)], 
                function(err) {
                    if (err) {
                        return console.log(err.message);
                    }
                })

            result.continue()
        }
    }
}

indexedDB.databases().then(result => {
    result.forEach((row) => {
        if (row.name.indexOf('s4l') == 0) {            
            toSQLite(row.name)
        }
    })
})

