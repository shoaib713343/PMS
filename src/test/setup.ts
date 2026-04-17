import { beforeAll, afterAll } from '@jest/globals';

beforeAll(() => {
    console.log(' Starting tests...');
});

afterAll(() => {
    console.log('All tests completed!');
});