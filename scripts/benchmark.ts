import { runEngineBenchmarks } from "../src/engine";

const requestedIterations = Number(process.argv[2] ?? 2000);
if (!Number.isInteger(requestedIterations) || requestedIterations < 1) {
  throw new TypeError("Benchmark iterations must be a positive whole number.");
}

const results = runEngineBenchmarks(requestedIterations);
console.log(`Rock Paper Scissors 2 engine benchmark · ${requestedIterations} iterations`);
for (const result of results) {
  console.log(
    `${result.operation.padEnd(24)} ${result.averageMicroseconds.toFixed(2).padStart(10)} µs/op`,
  );
}
