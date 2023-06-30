import express, { json, urlencoded, static as staticRouter } from 'express';
import cors from 'cors';
import { DatabaseServer } from './DatabaseServer';
import session from 'express-session';
import { randomBytes } from 'crypto';
import MemoryStore from 'memorystore';
import 'dotenv/config';
import history from 'connect-history-api-fallback';
import { readFile } from 'fs/promises';
import { createServer } from 'https';

/**
 * Main class and entrypoint of the backend server.
 */
class loernwerkServer {
    /**
     * Entrypoint of the backend server.
     */
    public static async main(): Promise<void> {
        console.log('loernwerk booting up.');

        // Setting up webserver, database server
        const app = express();
        await DatabaseServer.getInstance().initialize();

        // Setting up Cross-Origin-Resource-Sharing for dev environment
        app.use(
            cors({
                credentials: true,
                origin: 'http://localhost:8080',
            })
        );

        // Setting up parsers to parse HTTP bodies
        app.use(json());
        app.use(urlencoded({ extended: true }));

        // Setting up cookies
        app.use(
            session({
                name: 'loernwerk.session',
                resave: false,
                saveUninitialized: false,
                secret: randomBytes(64).toString('hex'),
                cookie: {
                    maxAge: 1000 * 60 * 60 * 24,
                },
                store: new (MemoryStore(session))({
                    checkPeriod: 1000 * 60 * 60,
                }),
            })
        );

        // Setting up routers, TODO

        // Serving built vue app
        app.use(history());
        app.use(staticRouter('build/dist'));

        // Graceful shutdown listener
        process.on('SIGINT', () => {
            console.log(''); // Empty line to avoid ^C from some shells
            console.log('loernwerk shutting down');
            DatabaseServer.getInstance().destroy();
            process.exit(0);
        });

        const port = parseInt(process.env.PORT) || 5000;
        const hostname = process.env.HOSTNAME || 'localhost';

        const caFile = process.env.SSL_CAFILE;
        const keyFile = process.env.SSL_KEYFILE;
        const certFile = process.env.SSL_CERTFILE;
        const sslPort = parseInt(process.env.SSL_PORT) || 5443;

        // Starting the server
        app.listen(port, hostname, () => {
            console.log(`loernwerk running @ ${hostname}:${port}`);
        });

        if (keyFile !== undefined && certFile !== undefined) {
            createServer(
                {
                    ca:
                        caFile !== undefined
                            ? await readFile(caFile)
                            : undefined,
                    key: await readFile(keyFile),
                    cert: await readFile(certFile),
                },
                app
            ).listen(sslPort, hostname, () => {
                console.log(
                    `loernwerk with ssl running @ ${hostname}:${sslPort}`
                );
            });
        }
    }
}

void loernwerkServer.main();
