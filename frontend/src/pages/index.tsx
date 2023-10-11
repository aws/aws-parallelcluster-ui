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

import React from 'react'
import {BrowserRouter, Route, Routes, Navigate} from 'react-router-dom'

import {LoadInitialState} from '../model'

import Clusters from '../old-pages/Clusters/Clusters'
import Configure from '../old-pages/Configure/Configure'
import Users from '../old-pages/Users/Users'

// Components
import {NoMatch} from '../components/NoMatch'
import {Images} from '../old-pages/Images'
import {Logs} from '../old-pages/Logs'
import {useLoadingState} from '../components/useLoadingState'

export default function App() {
  const {loading, content} = useLoadingState(
    <BrowserRouter>
      <Routes>
        <Route
          path="index.html"
          element={<Navigate replace to="/clusters" />}
        />
        <Route index element={<Navigate replace to="/clusters" />} />
        <Route path="clusters" element={<Clusters />}>
          <Route path=":clusterName" element={<div></div>}>
            <Route path=":tab" element={<div></div>} />
          </Route>
        </Route>
        <Route path="clusters/:clusterName/logs" element={<Logs />} />
        <Route path="configure" element={<Configure />} />
        <Route path="images" element={<Images />} />
        <Route path="users" element={<Users />} />
        <Route path="*" element={<NoMatch />} />
      </Routes>
    </BrowserRouter>,
  )

  React.useEffect(() => {
    if (!loading) {
      LoadInitialState()
    }
  }, [loading])

  return content
}
