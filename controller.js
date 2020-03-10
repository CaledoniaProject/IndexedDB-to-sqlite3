const sqlite3 = require('sqlite3')
const fs = require('fs')

function copyData(mydb) {
    var cursor = event.target.result
    var store

    store = cursor.transaction(['conversationsv14'], 'readonly').objectStore('conversationsv14')
    store.openCursor().onsuccess = function (event) {
        let result = event.target.result
        if (result == null) {
            console.log('Done writing conversations')
            return
        }

        if (result.value.conv.lastMessage) {
            mydb.run(`INSERT INTO conversations(id, detail) VALUES(?, ?)`,
                [result.key, JSON.stringify(result.value)],
                function (err) {
                    if (err) {
                        return console.log(err.message);
                    }
                })
        }

        result.continue()
    }

    store = cursor.transaction(['profilecachev8'], 'readonly').objectStore('profilecachev8')
    store.openCursor().onsuccess = function (event) {
        let result = event.target.result
        if (result == null) {
            console.log('Done writing profiles')
            return
        }

        mydb.run(`INSERT INTO profiles(id, detail) VALUES(?, ?)`,
            [result.key, JSON.stringify(result.value)],
            function (err) {
                if (err) {
                    return console.log(err.message);
                }
            })

        result.continue()
    }

    store = cursor.transaction(['messagesv12'], 'readonly').objectStore('messagesv12')
    store.openCursor().onsuccess = function (event) {
        let result = event.target.result
        if (result == null) {
            console.log('Done writing messages, closing window')
            window.close()
            return
        }

        mydb.run(`INSERT INTO messages(id1, time, detail) VALUES(?, ?, ?)`,
            [result.key[0], result.value.createdTime, JSON.stringify(result.value)],
            function (err) {
                if (err) {
                    return console.log(err.message);
                }
            })

        result.continue()
    }

    store = cursor.transaction(['internaldata'], 'readonly').objectStore('internaldata')
    store.openCursor().onsuccess = function (event) {
        let result = event.target.result
        if (result == null) {
            console.log('Done writing internaldata')
            return
        }

        mydb.run(`INSERT INTO internaldata(id, detail) VALUES(?, ?)`,
            [result.key, JSON.stringify(result.value)],
            function (err) {
                if (err) {
                    return console.log(err.message);
                }
            })

        result.continue()
    }
}

async function toSQLite(name) {
    if (!fs.existsSync('output')) {
        fs.mkdirSync('output')
    }

    // let dbpath = 'output/' + name + '.db'
    let dbpath = '/tmp/test.db'
    if (fs.existsSync(dbpath)) {
        fs.unlinkSync(dbpath)
    }

    console.log('Output to', dbpath)

    let mydb = new sqlite3.Database(dbpath)
    await mydb.run('CREATE TABLE profiles(id TEXT PRIMARY KEY, detail TEXT)')
    await mydb.run('CREATE TABLE conversations(id TEXT PRIMARY KEY, detail TEXT)')
    await mydb.run('CREATE TABLE messages(id1 TEXT, time TEXT, detail TEXT)')
    await mydb.run('CREATE TABLE internaldata(id TEXT, detail TEXT)')

    console.log('Delay 1s for table creation')
    setTimeout(() => {
        indexedDB.open(name).onsuccess = function (event) {
            copyData(mydb)
        }
    }, 1000)
}

indexedDB.databases().then(result => {
    result.forEach((row) => {
        if (row.name.indexOf('s4l') == 0) {
            toSQLite(row.name)
        }
    })
})

