import { v4 as uuidv4 } from 'uuid';

export function normalizeRobotName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export function isValidRobotName(name: string): boolean {
  return /^[a-zA-Z0-9_]+$/.test(name);
}

export function isValidVersionFormat(version: string): boolean {
  if (!version) return false;
  return /^v\d+\.\d+\.\d+$/.test(version);
}

export function suggestNextVersion(currentVersion: string): string {
  if (!currentVersion || !isValidVersionFormat(currentVersion)) {
    return 'v1.0.0';
  }

  const match = currentVersion.match(/^v(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return 'v1.0.0';

  const [, major, minor, patch] = match;
  return `v${major}.${minor}.${parseInt(patch) + 1}`;
}

export async function generateUniqueVersionName(
  baseVersionName: string,
  existingVersions: any[],
  maxAttempts: number = 100
): Promise<string> {
  if (!baseVersionName) {
    return 'Versão 1';
  }
  
  // First, try to find the highest version number
  let highestVersion = 0;
  
  existingVersions.forEach(v => {
    // Match "Versão X" pattern
    const match = v.version_name?.match(/^Versão (\d+)$/);
    if (match) {
      const versionNum = parseInt(match[1], 10);
      if (!isNaN(versionNum) && versionNum > highestVersion) {
        highestVersion = versionNum;
      }
    }
  });
  
  // Try incrementing numbers until we find a unique name
  for (let i = 1; i <= maxAttempts; i++) {
    let versionName: string;
    
    if (baseVersionName.startsWith('v')) {
      // For semantic versioning format (vX.Y.Z)
      const match = baseVersionName.match(/^v(\d+)\.(\d+)\.(\d+)$/);
      if (match) {
        const [, major, minor, patch] = match;
        versionName = `v${major}.${minor}.${parseInt(patch) + i}`;
      } else {
        versionName = `${baseVersionName}_${i}`;
      }
    } else if (baseVersionName.startsWith('Versão')) {
      // For "Versão X" format
      versionName = `Versão ${highestVersion + i}`;
    } else {
      // For other formats, append a number
      versionName = `${baseVersionName}_${i}`;
    }
    
    // Check if this name is unique
    if (!existingVersions.some(v => v.version_name === versionName)) {
      return versionName;
    }
  }
  
  // If we couldn't find a unique name after maxAttempts, add a timestamp
  const timestamp = new Date().getTime();
  return `${baseVersionName}_${timestamp}`;
}