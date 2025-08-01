const fs = require('fs');

function readInput(filePath) {
    const raw = fs.readFileSync(filePath);
    return JSON.parse(raw);
}


function decodePoints(data) {
    const { n, k } = data.keys;
    const points = [];

    for (let key in data) {
        if (key === "keys") continue;
        const x = parseInt(key);
        const { base, value } = data[key];
        const y = parseInt(value, parseInt(base));
        points.push([x, y]);
    }

    if (points.length < k) {
        throw new Error("Not enough points to interpolate polynomial");
    }

    return points.slice(0, k);
}


function lagrangeSecretAtZero(points) {
    let secret = 0;

    for (let i = 0; i < points.length; i++) {
        const [xi, yi] = points[i];
        let li = 1;

        for (let j = 0; j < points.length; j++) {
            if (i === j) continue;
            const [xj] = points[j];
            li *= -xj / (xi - xj); // Lagrange basis polynomial at x = 0
        }

        secret += yi * li;
    }

    return Math.round(secret); // Round to remove floating-point error
}


function main() {
    const inputData = readInput('input.json');
    const points = decodePoints(inputData);
    const secret = lagrangeSecretAtZero(points);
    console.log("Constant Term of Polynomial:", secret);
}

main();