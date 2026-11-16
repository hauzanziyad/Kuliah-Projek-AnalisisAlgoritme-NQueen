#ifndef SOLVER_INTERFACE_HPP
#define SOLVER_INTERFACE_HPP

#include <vector>
#include <string>

namespace nqueen {

enum class ProblemCategory {
    NORMAL = 0,
    PREPLACED = 1,
    HOLES = 2,
    WALLED = 3
};

struct Coordinate {
    int row;
    int col;
};

struct BoardConfig {
    ProblemCategory category;
    int n;
    std::vector<Coordinate> lockedQueens;
    std::vector<Coordinate> holes;
    std::vector<Coordinate> walls;
};

struct Solution {
    int id;
    std::vector<Coordinate> queenPositions;
};

struct SolverMetrics {
    double totalExecutionTimeMs;
    int nodesExplored;
    int maxQueensFound; // Specifically for Walled category
    int optimalSolutionsCount;
    double memoryUsageKb;
};

struct SolverResult {
    std::string solverId;
    std::string status; // "COMPLETED", "TIMEOUT", "ERROR"
    std::vector<Solution> solutions;
    SolverMetrics metrics;
};

/**
 * Pure abstract base class for N-Queen algorithms
 */
class INQueenSolver {
public:
    virtual ~INQueenSolver() = default;
    virtual std::string getId() const = 0;
    virtual std::string getName() const = 0;
    virtual SolverResult solve(const BoardConfig& config) = 0;
};

} // namespace nqueen

#endif // SOLVER_INTERFACE_HPP
