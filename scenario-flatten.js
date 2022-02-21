#!/usr/bin/env node

import {Command} from 'commander'
import utils from './src/utils.js'

const program = new Command()

program
    .requiredOption('-s, --scenario <scenario>', 'Scenario file in json')

program.on('-h, --help', () => {
    console.log('')
    console.log('Example calls:')
    console.log('  $ scenario-flatten --scenario scenario.json')
    console.log('  $ scenario-flatten -s scenario.json')
})

program.parse(process.argv)

const scenarioJson = utils.flattenInputArray(utils.openFile(program.opts().scenario))

const outputFile = program.opts().scenario.replace('.json', '-flattened.json')

utils.saveToFile(outputFile, scenarioJson)

console.log('Flattened file to file ' + outputFile)
