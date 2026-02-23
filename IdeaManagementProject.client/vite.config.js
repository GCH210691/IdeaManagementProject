import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { env } from 'process';

const baseFolder =
    env.APPDATA !== undefined && env.APPDATA !== ''
        ? `${env.APPDATA}/ASP.NET/https`
        : `${env.HOME}/.aspnet/https`;

const certificateName = 'idea-management-project.client';
const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

if (!fs.existsSync(baseFolder)) {
    fs.mkdirSync(baseFolder, { recursive: true });
}

if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
    if (0 !== child_process.spawnSync('dotnet', [
        'dev-certs',
        'https',
        '--export-path',
        certFilePath,
        '--format',
        'Pem',
        '--no-password'
    ], { stdio: 'inherit' }).status) {
        throw new Error('Could not create certificate.');
    }
}

function resolveBackendTarget() {
    if (env.ASPNETCORE_URLS) {
        const urls = env.ASPNETCORE_URLS.split(';').map((u) => u.trim()).filter(Boolean);
        const httpsUrl = urls.find((u) => u.startsWith('https://'));
        return httpsUrl || urls[0];
    }

    if (env.ASPNETCORE_HTTPS_PORT) {
        return `https://localhost:${env.ASPNETCORE_HTTPS_PORT}`;
    }

    if (env.ASPNETCORE_HTTP_PORT) {
        return `http://localhost:${env.ASPNETCORE_HTTP_PORT}`;
    }

    return 'https://localhost:7115';
}

const target = resolveBackendTarget();

export default defineConfig({
    plugins: [plugin()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        proxy: {
            '^/(api|weatherforecast)': {
                target,
                secure: false
            }
        },
        port: parseInt(env.DEV_SERVER_PORT || '59420', 10),
        https: {
            key: fs.readFileSync(keyFilePath),
            cert: fs.readFileSync(certFilePath)
        }
    }
});
