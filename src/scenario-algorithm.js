import utils from './utils.js'

function toTechnology(technology) {
    return technology || 'HTTP'
}

function replace(target, config) {
    let returnTarget = target
    Object.keys(config)
        .forEach(key => {
            returnTarget = returnTarget.replaceAll('{' + key + '}', config[key])
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
            interaction.request[key] = replace(JSON.stringify(input.requestTemplate[key]), input.replace)
        })

    Object.keys(input.responseTemplate)
        .forEach(key => {
            interaction.response[key] = replace(JSON.stringify(input.responseTemplate[key]), input.replace)
        })

    return {
        [toTechnology(input.technology)]: {
            ...interaction
        }
    }
}

function toInteractions(input, numInteractions) {
    const interactions = []

    for (let i = 0; i < numInteractions; i++) {
        if (input.generate) {
            const generated = utils.generateReplace(input.replace, input.generate)
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

function toRequest(request) {
    const {
        headerFile,
        ...outRequest
    } = request // filter out headerFile

    return outRequest
}

function toScenario(input, globalReplace) {
    return input.interactions
        .map(interaction => {
            const interactionTemplate = (interaction.templateFile ? utils.openFile(interaction.templateFile) : interaction.template)[toTechnology(interaction.technology)]

            return toInteractions(
                {
                    replace: {
                        ...globalReplace,
                        ...interaction?.replace
                    },
                    technology: interaction.technology,
                    generate: interaction.generate,
                    requestTemplate: {
                        ...toRequest(interactionTemplate.request),
                        headers: toHeaders(
                            interactionTemplate.request?.headerFile,
                            interactionTemplate.request?.headers,
                            input?.headerTemplateFile?.[toTechnology(interaction.technology)]
                        )
                    },
                    responseTemplate: {
                        ...interactionTemplate.response
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
            scenarios.push(toScenario(input, utils.toReplace(input)))
        }

        return utils.flattenInputArray(scenarios)
    },

    createScenario: (input, globalReplace = {}) => {
        return toScenario(input, globalReplace)
    }
}
