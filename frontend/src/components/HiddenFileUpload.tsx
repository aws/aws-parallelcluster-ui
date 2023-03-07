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

import {useRef, useCallback, ChangeEventHandler, useEffect} from 'react'

interface Props {
  open: boolean
  onChange: (data: string) => void
  onDismiss: () => void
}

export function HiddenFileUpload({onChange, onDismiss, open}: Props) {
  const hiddenFileInput = useRef<HTMLInputElement>(null)

  const handleClick = useCallback(() => {
    if (!hiddenFileInput?.current) return

    hiddenFileInput.current.click()
  }, [hiddenFileInput])

  const onFileChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    event => {
      const {
        target: {files},
      } = event

      if (!files || files.length < 1) {
        return
      }

      const [file] = files
      const reader = new FileReader()
      reader.onload = function () {
        onChange(reader.result as string)
      }
      reader.readAsText(file)
    },
    [onChange],
  )

  useEffect(() => {
    if (open) {
      handleClick()
      /**
       * Immediately dismiss the selector,
       * to allow callers to reset the `open` prop.
       *
       * This is needed as there is no way to intercept
       * actual cancel event on the brower's file picker
       */
      onDismiss()
    }
  }, [handleClick, onDismiss, open])

  return (
    <input
      type="file"
      ref={hiddenFileInput}
      onInput={onFileChange}
      style={{display: 'none'}}
    />
  )
}
