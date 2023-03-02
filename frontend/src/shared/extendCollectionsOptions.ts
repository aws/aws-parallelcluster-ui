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

import {UseCollectionOptions} from '@cloudscape-design/collection-hooks'

const DEFAULT_USE_COLLECTION_OPTIONS = {
  pageSize: 20,
}

export function extendCollectionsOptions<T = any>(
  options: UseCollectionOptions<T> = {},
): UseCollectionOptions<T> {
  return {
    ...options,
    pagination: {
      pageSize: DEFAULT_USE_COLLECTION_OPTIONS.pageSize,
      ...options.pagination,
    },
  }
}
