// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
// with the License. A copy of the License is located at
//
// http://aws.amazon.com/apache2.0/
//
// or in the "LICENSE.txt" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
// OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and
// limitations under the License.

import {validateUser} from '../AddUserModal'

describe('Given a function to validate a user email', () => {
  describe('when the email is not in a correct format', () => {
    const username = 'test-email'
    it('should fail the validation', () => {
      expect(validateUser(username)).toEqual(false)
    })
  })

  describe('when the email is missing a top-level domain', () => {
    const username = 'test-email@domain'
    it('should fail the validation', () => {
      expect(validateUser(username)).toEqual(false)
    })
  })

  describe('when the email is in a correct format', () => {
    const username = 'test-email@domain.com'
    it('should be validated', () => {
      expect(validateUser(username)).toEqual(true)
    })
  })
})
