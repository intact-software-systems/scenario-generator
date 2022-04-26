import utils from './utils.js'

function toTechnology(technology) {
    return technology || 'HTTP'
}

function replaceData(target, config) {
    let returnTarget = target
    Object.keys(config)
        .forEach(key => {
            returnTarget = returnTarget.replaceAll('{' + key + '}', config[key])
        })

    return JSON.parse(returnTarget)
}

function toInteractionRuleRange(key, value, maxNumber) {
    if (key.startsWith('>')) {
        return [Number.parseInt(key.replace('>', '')), Number.parseInt(maxNumber)]
    }

    if (key.includes('-')) {
        const numbers = key.split('-')
        if (numbers[0] > numbers[1]) {
            throw 'Invalid number range: ' + key
        }

        return [Number.parseInt(numbers[0]), Number.parseInt(numbers[1])]
    }

    const number = Number.parseInt(key)
    if (number) {
        return [number, number]
    }

    return [0, 0]
}


function toInteractionReplaceRule(interactionReplaceRules, i, numOfInteractions) {
    let entries = Object.entries(interactionReplaceRules || {})
    if (entries.length <= 0) {
        return {}
    }

    return entries
        .filter(([key, value]) => {
            const range = toInteractionRuleRange(key, value, numOfInteractions)
            return range[0] <= i && range[1] >= i
        })
        .map(([key, value]) => {
            return value
        })[0] || {}
}

function replaceAlways(target, replace, generateAlways) {
    const config = {
        ...replace,
        ...utils.generateReplace(generateAlways, replace)
    }

    const keys = Object.keys(config)

    let returnTarget = target
    keys.forEach(key => {
        returnTarget = returnTarget.replaceAll(
            '{' + key + '}',
            () => {
                const newConfig = {
                    ...replace,
                    ...utils.generateReplace(generateAlways, replace)
                }

                return newConfig[key]
            }
        )
    })

    return JSON.parse(returnTarget)
}

function toInteraction(input) {
    const interaction = {
        request: {},
        response: {}
    }

    Object.keys(input.requestTemplate)
        .forEach(key => {
            if (input.generateAlways) {
                interaction.request[key] = replaceAlways(JSON.stringify(input.requestTemplate[key]), input.replace, input.generateAlways)
            }
            else {
                interaction.request[key] = replaceData(JSON.stringify(input.requestTemplate[key]), input.replace)
            }
        })

    Object.keys(input.responseTemplate)
        .forEach(key => {
            if (input.generateAlways) {
                interaction.response[key] = replaceAlways(JSON.stringify(input.responseTemplate[key]), input.replace, input.generateAlways)
            }
            else {
                interaction.response[key] = replaceData(JSON.stringify(input.responseTemplate[key]), input.replace)
            }
        })

    return {
        [input.technology]: {
            ...interaction
        }
    }
}

function toInteractions(input, numOfInteractions) {
    const interactions = []

    for (let i = 1; i < numOfInteractions + 1; i++) {
        const interactionReplaceRule = toInteractionReplaceRule(input.interactionReplaceRules, i, numOfInteractions)

        input.generateForEach = [
            ...(input.generateForEach ? input.generateForEach : []),
            ...(interactionReplaceRule.generateForEach ? interactionReplaceRule.generateForEach : [])
        ]

        input.generateAlways = [
            ...(input.generateAlways ? input.generateAlways : []),
            ...(interactionReplaceRule.generateAlways ? interactionReplaceRule.generateAlways : [])
        ]

        const generated = utils.generateReplace(input.generateForEach, input.replace)

        input.replace = {
            ...input.replace,
            ...generated,
            ...interactionReplaceRule?.replace
        }

        interactions.push(toInteraction(input))
    }

    return interactions
}

function toHeaders(headerFile, headers, defaultHeaders) {
    if (headerFile) {
        return utils.openFile(headerFile)
    }
    return headers ? headers : utils.openFile(defaultHeaders)
}

function resolveInputData(data) {
    const extracted = data?.templateFile
        ? utils.openFile(data.templateFile)
        : data.template

    const final = data?.entryName && extracted
        ? extracted[data?.entryName]
        : extracted

    return final || data
}

function toRequest(request) {
    const {
        headerFile,
        ...outRequest
    } = request // filter out headerFile

    outRequest.body = request.body ? resolveInputData(request.body) : {}

    return outRequest
}

function toResponse(response) {
    const {...outResponse} = response

    outResponse.body = response.body ? resolveInputData(response.body) : {}

    return outResponse
}

function toInteractionTemplate(interaction) {
    const interactionData = resolveInputData(interaction)

    return interactionData[toTechnology(interaction.technology)] || interactionData
}

function toGenerateAlways(inputGenerateAlways, interactionGenerateAlways) {
    return [
        ...(inputGenerateAlways ? inputGenerateAlways : []),
        ...(interactionGenerateAlways ? interactionGenerateAlways : [])
    ]
}


function toScenario(input, globalReplace) {
    return input.interactions
        .map(interaction => {
            const interactionTemplate = toInteractionTemplate(interaction)

            const numOfInteractions = interaction.numOfInteractions || 1

            return toInteractions(
                {
                    replace: {
                        ...globalReplace,
                        ...interaction?.replace
                    },
                    interactionReplaceRules: interaction.interactionReplaceRules,
                    technology: toTechnology(interaction.technology),
                    generateForEach: interaction.generateForEach || [],
                    generateAlways: toGenerateAlways(input.generateAlways, interaction.generateAlways),
                    requestTemplate: {
                        ...toRequest(interactionTemplate.request),
                        headers: toHeaders(
                            interactionTemplate.request?.headerTemplateFile,
                            interactionTemplate.request?.headers,
                            input?.headerTemplateFile?.[toTechnology(interaction.technology)] || input?.headerTemplateFile
                        )
                    },
                    responseTemplate: {
                        ...toResponse(interactionTemplate.response)
                    }
                },
                numOfInteractions
            )
        })
}

export default {
    createScenarios: (input, numOfScenarios = 1) => {
        const scenarios = []

        for (let i = 0; i < numOfScenarios; i++) {
            scenarios.push(toScenario(input, utils.toReplace(input.generateForEach, input.replace)))
        }

        return utils.flattenInputArray(scenarios)
    },
    createScenario: (input, globalReplace = {}) => toScenario(input, globalReplace)
}
