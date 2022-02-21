import input from 'scenario-generator/test-data/input.json'
import algorithm from 'scenario-generator/src/scenario-algorithm.js'

// import {jest} from '@jest/globals';

describe('test scenario generation', () => {
    test('test new', () => {
        algorithm.createScenario(input)
    })
})