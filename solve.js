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
        const x = BigInt(key);
        const { base, value } = data[key];
        const y = BigInt(parseInt(value, parseInt(base)).toString()); // Convert via base then wrap as BigInt
        points.push([x, y]);
    }

    if (points.length < k) {
        throw new Error("Not enough points to interpolate polynomial");
    }

    return points.slice(0, k);
}

// Lagrange interpolation at x = 0, using BigInt
function lagrangeSecretAtZero(points) {
    let secret = 0n;

    for (let i = 0; i < points.length; i++) {
        let [xi, yi] = points[i];
        let numerator = 1n;
        let denominator = 1n;

        for (let j = 0; j < points.length; j++) {
            if (i === j) continue;
            let [xj] = points[j];
            numerator *= -xj;
            denominator *= (xi - xj);
        }

        // Multiply yi * numerator / denominator
        // Do division last to avoid precision loss
        let term = yi * numerator / denominator;
        secret += term;
    }

    return secret;
}

function main() {
    const inputData = readInput('input.json');
    const points = decodePoints(inputData);
    const secret = lagrangeSecretAtZero(points);
    console.log("Constant Term of Polynomial:", secret.toString());
}

main();
