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

function clearTimeData(date: Date) {
  date.setHours(0)
  date.setMinutes(0)
  date.setSeconds(0)
  date.setMilliseconds(0)
}

export function composeTimeRange(today = new Date()) {
  const twelveMonthsAgo = new Date(today)

  clearTimeData(today)
  clearTimeData(twelveMonthsAgo)

  const currentYear = today.getFullYear()

  twelveMonthsAgo.setFullYear(currentYear - 1)

  return {
    fromDate: twelveMonthsAgo.toISOString(),
    toDate: today.toISOString(),
  }
}
