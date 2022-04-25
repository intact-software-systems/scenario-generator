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

function toInteractions(input, numInteractions) {
    const interactions = []

    for (let i = 0; i < numInteractions; i++) {
        if (input.generateForEach) {
            const generated = utils.generateReplace(input.generateForEach, input.replace)
            input.replace = {
                ...input.replace,
                ...generated
            }
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

            return toInteractions(
                {
                    replace: {
                        ...globalReplace,
                        ...interaction?.replace
                    },
                    technology: toTechnology(interaction.technology),
                    generateForEach: interaction.generateForEach,
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
                interaction.numOfInteractions || 1
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
