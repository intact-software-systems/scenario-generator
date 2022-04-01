#!/usr/bin/env node

import scenarios from './src/scenario-algorithm.js'
import utils from './src/utils.js'

import {Command} from 'commander'

const program = new Command()

program
    .requiredOption('-c, --config <config>', 'Config file in json format')

program.on('-h, --help', () => {
    console.log('')
    console.log('Example calls:')
    console.log('  $ scenario-generate --config config.json')
    console.log('  $ scenario-generate -c config.json')
})

program.parse(process.argv)

const input = utils.openFile(program.opts().config)

const requests = scenarios.createScenarios(input, input.numOfScenarios || 1)

const fileName = input.outputFile || 'scenario.json'
utils.saveToFile(fileName, requests)

console.log('Generated scenario to file ' + fileName)
