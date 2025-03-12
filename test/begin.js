import { expect } from "chai";
it('should add numbers correctly', function() {
    const num1 = 2;
    const num2 = 7;
    expect(num1 + num2).to.equal(9);
})

it('should return a string', function() {
    const str = 'hello world';
    expect(str).to.be.a('string');
})