const http = require('http');
const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, "data.json");
const statpath = path.join(__dirname, "status.json")
function GetJSON(data){
    try {
        return JSON.parse(data);
    } catch (e) {
        console.error("Error parsing");
        return null;
    }
}
function setstat(stat) {
    try {
        fs.writeFile(statpath, `{ "status" : "${stat}" }`, (err) => {
            if (err) {
                console.log("File write error", err);
                return 1;
            }
            return 0;
        });
        return 0;
    } catch(err) {
        console.log("error", err);
        return 1;
    }
}
const server = http.createServer((req, res) => {
    console.log(req.url);
    if(req.method === 'POST'){
        if(req.url === '/api/senddata') 
        {
            let body = '';
            req.setEncoding('utf8');
            req.on('data', (chunk) => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    let parsed = GetJSON(body);
                    if(parsed === null){
                        console.log("Invalid JSON");
                        return res.status(400).send('Invalid JSON');
                    }
                    let strfy = JSON.stringify(parsed, null, 2);
                    fs.writeFile(filepath, strfy, (err) => {
                        if (err) {
                            console.log("File write error", err);
                            return res.status(500).send('Server Error');
                        }
                        var ret = setstat(0);
                        if(ret === 0){
                            res.writeHead(200, { 'Content-type' : 'application/json' });
                            res.end(JSON.stringify({ message: 'Data received successfully', data: parsed }));
                        } else {
                            res.writeHead(500, { 'Content-type' : 'application/json'});
                            res.end('Internal Server Error');
                        }

                    });
                } catch (err) {
                    console.error('Error parsing JSON', err);
                    res.statusCode = 400;
                    res.end('Invalid JSON');
                }
            });
        } else {
            res.writeHead(404, { 'Content-type' : 'application/json'});
            res.end('404 Not found');
        }
    } else if(req.method === 'GET') {
        if(req.url === "/api/getdata"){
            try {
                const fetched = fs.readFileSync(filepath, 'utf8');
                var ret = setstat(1);
                if(ret === 0){
                    res.writeHead(200, { 'Content-type' : 'application/json'});
                    res.end(fetched);
                } else {
                    res.writeHead(500, { 'Content-type' : 'application/json'});
                    res.end('Internal Server Error');
                }
            } catch (err) {
                res.writeHead(500, { 'Content-type' : 'application/json'});
                res.end('Internal Server Error');
            }
        } else if(req.url === "/api/status") {
            try {
                const status = fs.readFileSync(statpath, 'utf8')
                res.writeHead(200, { 'Content-type' : 'application/json'});
                res.end(status);
            } catch (err) {
                res.writeHead(500, { 'Content-type' : 'application/json'});
                res.end('Internal Server Error');
            }
        } else {
            res.writeHead(404, { 'Content-type' : 'application/json'});
            res.end('404 Not Found');
        }
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});