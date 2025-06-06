import { 
    sum,
    subtract,
    multiply,
    divide
} from '../maths';

describe('maths', () => {
    test.each([
        { a: 1, b: 2, expected: 3 },
        { a: -1, b: 1, expected: 0 },
        { a: 0, b: 0, expected: 0 },
        { a: 100, b: 200, expected: 300 },
    ])('sum($a, $b) returns $expected', ({ a, b, expected }) => {
        expect(sum(a, b)).toBe(expected);
    });

    test.each([
        { a: 5, b: 3, expected: 2 },
        { a: -1, b: -1, expected: 0 },
        { a: 0, b: 0, expected: 0 },
        { a: 100, b: 50, expected: 50 },
    ])('subtract($a, $b) returns $expected', ({ a, b, expected }) => {
        expect(subtract(a, b)).toBe(expected);
    });

    test.each([
        { a: 2, b: 3, expected: 6 },
        { a: -1, b: 5, expected: -5 },
        { a: 0, b: 10, expected: 0 },
        { a: 7, b: 8, expected: 56 },
    ])('multiply($a, $b) returns $expected', ({ a, b, expected }) => {
        expect(multiply(a, b)).toBe(expected);
    });

    test.each([
        { a: 6, b: 3, expected: 2 },
        { a: -10, b: -2, expected: 5 },
        { a: 0, b: 1, expected: 0 },
        { a: 100, b: 25, expected: 4 },
    ])('divide($a, $b) returns $expected', ({ a, b, expected }) => {
        expect(divide(a, b)).toBe(expected);
    }); 

    test('divide throws error on division by zero', () => {
        expect(() => divide(5, 0)).toThrow('Division by zero is not allowed.');
    });
});