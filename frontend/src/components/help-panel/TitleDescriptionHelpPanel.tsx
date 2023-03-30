// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
// with the License. A copy of the License is located at
//
// http://aws.amazon.com/apache2.0/
//
// or in the "LICENSE.txt" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
// OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and
// limitations under the License.

import {HelpPanel, Icon, Link} from '@cloudscape-design/components'
import {ReactElement, useMemo} from 'react'
import {useTranslation} from 'react-i18next'

interface TitleDescriptionHelpPanelProps {
  title: string | ReactElement
  description: string | ReactElement
  footerLinks?: {title: string; href: string}[]
}

function TitleDescriptionHelpPanel({
  title,
  description,
  footerLinks,
}: TitleDescriptionHelpPanelProps) {
  const {t} = useTranslation()

  const footerLinkProp = useMemo(() => {
    if (!footerLinks) {
      return undefined
    }

    return (
      <div>
        <h3>
          {t('helpPanel.footer.learnMore')} <Icon name="external" />
        </h3>
        <ul>
          {footerLinks.map(link => (
            <li key={link.href}>
              <Link href={link.href}>{link.title}</Link>
            </li>
          ))}
        </ul>
      </div>
    )
  }, [footerLinks, t])

  return (
    <HelpPanel header={<h2>{title}</h2>} footer={footerLinkProp}>
      <div>{description}</div>
    </HelpPanel>
  )
}

export default TitleDescriptionHelpPanel
