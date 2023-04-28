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

export function toFullDollarAmount(value: number) {
  return '$' + value.toLocaleString('en-US')
}

export function toShortDollarAmount(value: number) {
  const absValue = Math.abs(value)

  if (absValue >= 1e9) {
    return (value / 1e9).toFixed(1) + 'G'
  }

  if (absValue >= 1e6) {
    return (value / 1e6).toFixed(1) + 'M'
  }

  if (absValue >= 1e3) {
    return (value / 1e3).toFixed(1) + 'K'
  }

  return value.toFixed(2)
}
