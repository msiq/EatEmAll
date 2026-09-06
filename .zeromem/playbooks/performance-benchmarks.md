# Playbook: Performance & Stress Testing

## 1. Standard Benchmark
Runs headless bot simulations and tracks average tick rate and memory allocation:
```bash
npm run benchmark
```

## 2. Breaking Point Stress Test
Spawns synthetic worker threads ramping entities from 1,000 to 10,000 to detect:
* Maximum concurrent entities before tick loop exceeds 25ms
* Quadtree query saturation points
* Memory leak verification (<1,400MB ceiling)
```bash
npm run benchmark:breaking
```
