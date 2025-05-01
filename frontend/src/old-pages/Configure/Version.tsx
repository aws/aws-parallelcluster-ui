import React, {useEffect} from 'react'
import i18next from 'i18next'
import {useTranslation} from 'react-i18next'
import {Container, Header, SpaceBetween} from '@cloudscape-design/components'
import {ClusterVersionField} from './Version/ClusterVersionField'
import InfoLink from '../../components/InfoLink'
import TitleDescriptionHelpPanel from '../../components/help-panel/TitleDescriptionHelpPanel'
import {getState, setState, clearState, useState} from '../../store'
import {useHelpPanel} from "../../components/help-panel/HelpPanel";

const errorsPath = ['app', 'wizard', 'errors', 'version']

function versionValidate() {
    const version = getState(['app', 'wizard', 'version'])
    if (!version) {
        setState(
            [...errorsPath, 'version'],
            i18next.t('wizard.version.validation.versionSelect'),
        )
        return false
    }
    clearState([...errorsPath, 'version'])
    return true
}


function Version() {
    const {t} = useTranslation()
    const editing = useState(['app', 'wizard', 'editing'])

    useHelpPanel(<VersionHelpPanel />)

    useEffect(() => {
        // Get the current version
        const currentVersion = getState(['app', 'wizard', 'version'])

        // Clear version only if we're not editing and there's no version set,
        // or if we're explicitly not in editing mode
        if (!editing && (currentVersion === undefined || currentVersion === null)) {
            setState(['app', 'wizard', 'version'], null)
        }
    }, [editing])

    return (
        <SpaceBetween direction="vertical" size="l">
            <Container
                header={
                    <Header
                        variant="h2"
                        info={<InfoLink helpPanel={<VersionHelpPanel />} />}
                    >
                        {t('wizard.version.label')}
                    </Header>
                }
            >
                <SpaceBetween direction="vertical" size="m">
                  <ClusterVersionField hideLabel={true} />
                </SpaceBetween>
            </Container>
        </SpaceBetween>
    )
}

const VersionHelpPanel = () => {
    const {t} = useTranslation()
    return (
        <TitleDescriptionHelpPanel
            title={t('wizard.version.title')}
            description={t('wizard.version.help.main')}
        />
    )
}

export {Version, versionValidate}