const fs = require('fs/promises');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const ENVS_DIR = path.join(__dirname, '../../envs');

async function ensureDir(dirPath) {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}

async function writeTerraformFiles(envId, tfData) {
    const envPath = path.join(ENVS_DIR, envId);
    await ensureDir(envPath);
    
    for (const [filename, content] of Object.entries(tfData)) {
        await fs.writeFile(path.join(envPath, filename), content);
    }
    return envPath;
}

async function runTerraformCommand(envId, command, credentials = null) {
    const envPath = path.join(ENVS_DIR, envId);
    
    // Safety check - we expect standard valid tf commands like init, plan, apply -auto-approve, destroy -auto-approve
    try {
        const execOptions = { cwd: envPath };
        if (credentials) {
            execOptions.env = {
                ...process.env,
                AWS_ACCESS_KEY_ID: credentials.access_key,
                AWS_SECRET_ACCESS_KEY: credentials.secret_key,
                AWS_DEFAULT_REGION: credentials.default_region || credentials.region
            };
        }
        const { stdout, stderr } = await execPromise(`terraform ${command}`, execOptions);
        return { success: true, stdout, stderr };
    } catch (error) {
        return { success: false, stdout: error.stdout, stderr: error.stderr, error: error.message };
    }
}

class TerraformRunner {
    static async setupEnvironment(envId, tfData, credentials) {
        await writeTerraformFiles(envId, tfData);
        return await runTerraformCommand(envId, 'init -upgrade', credentials);
    }

    static async plan(envId, credentials) {
        return await runTerraformCommand(envId, 'plan -no-color', credentials);
    }

    static async apply(envId, credentials) {
        return await runTerraformCommand(envId, 'apply -auto-approve -no-color', credentials);
    }

    static async destroy(envId, credentials) {
        return await runTerraformCommand(envId, 'destroy -auto-approve -no-color', credentials);
    }
}

module.exports = TerraformRunner;
