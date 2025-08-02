const fs = require('fs');

function readInput(filePath) {
    const raw = fs.readFileSync(filePath);
    return JSON.parse(raw);
}

function parseBigIntFromBase(str, base) {
    const digits = str.toLowerCase();
    const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
    let result = 0n;
    for (let i = 0; i < digits.length; i++) {
        const digit = chars.indexOf(digits[i]);
        if (digit === -1 || digit >= base) {
            throw new Error(`Invalid digit "${digits[i]}" for base ${base}`);
        }
        result = result * BigInt(base) + BigInt(digit);
    }
    return result;
}

function decodePoints(data) {
    const { n, k } = data.keys;
    const points = [];

    for (let key in data) {
        if (key === "keys") continue;
        const x = parseInt(key);
        const { base, value } = data[key];
        const y = parseBigIntFromBase(value, parseInt(base));
        points.push([x, y]);
    }

    if (points.length < k) {
        throw new Error("Not enough points to interpolate polynomial");
    }

    return points.slice(0, k); // Use only first k points
}

function gcd(a, b) {
    while (b !== 0n) {
        [a, b] = [b, a % b];
    }
    return a < 0n ? -a : a;
}

function reduce(n, d) {
    const g = gcd(n, d);
    return [n / g, d / g];
}

function addFractions([n1, d1], [n2, d2]) {
    const num = n1 * d2 + n2 * d1;
    const den = d1 * d2;
    return reduce(num, den);
}

function mulFractions([n1, d1], [n2, d2]) {
    const num = n1 * n2;
    const den = d1 * d2;
    return reduce(num, den);
}

function lagrangeSecretAtZero(points) {
    let secret = [0n, 1n]; // [numerator, denominator]

    for (let i = 0; i < points.length; i++) {
        const [xi, yi] = points[i];
        const xiBig = BigInt(xi);
        const yiBig = BigInt(yi);

        let li = [1n, 1n];

        for (let j = 0; j < points.length; j++) {
            if (i === j) continue;

            const [xj] = points[j];
            const xjBig = BigInt(xj);

            const num = -xjBig;
            const den = xiBig - xjBig;
            li = mulFractions(li, [num, den]);
        }

        const term = mulFractions([yiBig, 1n], li);
        secret = addFractions(secret, term);
    }
    const [num, den] = secret;
    return (num + den / 2n) / den; // round to nearest
}

function lagrangeInterpolateAtX(points, x) {
    let result = [0n, 1n]; // [numerator, denominator]

    for (let i = 0; i < points.length; i++) {
        const [xi, yi] = points[i];
        const xiBig = BigInt(xi);
        const yiBig = BigInt(yi);
        const xBig = BigInt(x);

        let li = [1n, 1n];

        for (let j = 0; j < points.length; j++) {
            if (i === j) continue;

            const [xj] = points[j];
            const xjBig = BigInt(xj);

            const num = xBig - xjBig;
            const den = xiBig - xjBig;
            li = mulFractions(li, [num, den]);
        }

        const term = mulFractions([yiBig, 1n], li);
        result = addFractions(result, term);
    }
    const [num, den] = result;
    return (num + den / 2n) / den; // round to nearest
}

function getAllPoints(data) {
    const points = [];
    for (let key in data) {
        if (key === "keys") continue;
        const x = parseInt(key);
        const { base, value } = data[key];
        const y = parseBigIntFromBase(value, parseInt(base));
        points.push([x, y]);
    }
    return points;
}

function findWrongPoints(data) {
    const { k } = data.keys;
    const allPoints = getAllPoints(data);
    const correctPoints = allPoints.slice(0, k); // Use first k points to determine polynomial
    const wrongPoints = [];

    console.log(`Using first ${k} points to determine the polynomial:`);
    correctPoints.forEach(([x, y]) => {
        console.log(`Point (${x}, ${y})`);
    });
    console.log();

    // Check all points against the polynomial defined by first k points
    for (const [x, y] of allPoints) {
        const expectedY = lagrangeInterpolateAtX(correctPoints, x);
        if (expectedY !== y) {
            wrongPoints.push({
                x: x,
                actualY: y,
                expectedY: expectedY,
                point: [x, y]
            });
        }
    }

    return wrongPoints;
}


function main() {
    const inputData = readInput('input.json');
    const points = decodePoints(inputData);
    const secret = lagrangeSecretAtZero(points);
    console.log("Constant Term of Polynomial:", secret.toString());
    console.log();
    
    // Find and display wrong points
    const wrongPoints = findWrongPoints(inputData);
    
    if (wrongPoints.length > 0) {
        console.log("Wrong points detected:");
        wrongPoints.forEach((wrong, index) => {
            console.log(`${index + 1}. Point ${wrong.x}:`);
            console.log(`   Actual Y:   ${wrong.actualY}`);
            console.log(`   Expected Y: ${wrong.expectedY}`);
            console.log(`   Original data: base ${inputData[wrong.x].base}, value "${inputData[wrong.x].value}"`);
            console.log();
        });
    } else {
        console.log("No wrong points detected. All points fit the polynomial.");
    }
}

main();