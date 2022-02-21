import crypto from 'crypto'
import {v4} from 'uuid'
import {readFileSync, writeFile} from 'fs'

function randomIban(countryCode, technicalOrgNum) {
    return countryCode + randomInteger(20, 90) + technicalOrgNum + randomInteger(1000000, 9999999)
}

function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min
}

function cryptoUuid() {
    return crypto.randomBytes(36).toString('hex')
}

function uuid() {
    return v4()
}

function generateReplace(generate, config) {
    const generated = generate
        .map(value => {
            switch (value) {
                case 'uuid':
                    return {
                        uuid: uuid()
                    }
                case 'iban':
                    return {
                        iban: config.bankOrgID
                            ? randomIban(config.country, config.bankOrgID)
                            : undefined
                    }
                case 'date':
                    return {
                        date: new Date().toISOString().slice(0, 10)
                    }
                case 'bankOrgID':
                    return {
                        bankOrgID: randomInteger(1000, 9999999).toString()
                    }
                case 'orgId':
                    return {
                        orgId: '0' + randomInteger(10000000000000000, 99999999999999999).toString()
                    }
                case 'amount':
                    return {
                        amount: randomInteger(1, 99999999)
                    }
                default:
                    return undefined
            }
        })
        .filter(gen => gen !== undefined)
        .reduce((a, b) => {
            return {...a, ...b}
        })

    if (generate.includes('iban') && !generated.iban) {
        return {
            ...generated,
            iban: randomIban(config.country, config.bankOrgID || generated.bankOrgID)
        }
    }
    return generated
}

export default {
    saveToFile: (fileName, data) => {
        writeFile(fileName, JSON.stringify(data, null, 2), 'utf8', (err) => {
            if (err) {
                throw 'Failed to save' + err
            }
        })
    },
    openFile: filename => {
        return JSON.parse(readFileSync(filename))
    },

    toReplace: input => {
        const defaultReplace = {
            env: 'DEV',
            sys: 'APP',
            source: 'APP',
            country: 'NO',
            currency: 'NOK',
            userID: 'aTestTool'
        }

        const generatedReplace = generateReplace(
            input.generate,
            {
                ...defaultReplace,
                ...input.replace
            }
        )

        return {
            ...defaultReplace,
            ...input.replace,
            ...generatedReplace
        }
    },

    generateReplace: (config, generate) => generateReplace(generate, config),

    flattenInputArray: array => array
        .reduce((a, b) => {
            if (Array.isArray(a) && Array.isArray(b)) {
                return [...a, ...b]
            }
            else if (Array.isArray(a)) {
                return [...a, b]
            }
            else if (Array.isArray(b)) {
                return [a, ...b]
            }
            return [a, b]
        })
}