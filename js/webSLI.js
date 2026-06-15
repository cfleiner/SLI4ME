export async function getVersionMap() {
    const url = 'https://gitlab.com/api/v4/projects/52004375/releases';

    try {
        const response = await fetch(url);
        const releases = await response.json();

        // 1. Initial Reduction (Create the raw object)
        const rawMap = releases.reduce((acc, release) => {
            const emscriptenLink = release.assets?.links?.find(l => 
                l.url.includes('emscripten') && l.url.endsWith('.whl')
            );

            if (emscriptenLink) {
                const versionMatch = release.tag_name.match(/(\d+\.\d+\.\d+)/);
                if (versionMatch) {
                    acc[versionMatch[0]] = emscriptenLink.url;
                }
            }
            return acc;
        }, {});

        // 2. Define a Semantic Version Comparison function
        // Returns -1 if a > b, 1 if a < b, 0 if equal
        const compareVersions = (a, b) => {
            const partA = a.split('.').map(Number);
            const partB = b.split('.').map(Number);
            
            for (let i = 0; i < Math.max(partA.length, partB.length); i++) {
                const numA = partA[i] || 0;
                const numB = partB[i] || 0;
                if (numA > numB) return -1; // We want Large to Small, so return -1 for "greater"
                if (numA < numB) return 1;
            }
            return 0;
        };

        // 3. Get the keys and sort them using our custom logic
        const sortedKeys = Object.keys(rawMap).sort(compareVersions);

        // 4. Rebuild the object in the new sorted order
        const sortedMap = {};
        sortedKeys.forEach(key => {
            sortedMap[key] = rawMap[key];
        });

        // 5. Add "latest" (The first key in a Large -> Small list is the newest)
        if (sortedKeys.length > 0) {
            const newestVersion = sortedKeys[0];
            sortedMap["latest"] = sortedMap[newestVersion];
        }

        return sortedMap;

    } catch (error) {
        console.error("Error:", error);
        return {};
    }
}
