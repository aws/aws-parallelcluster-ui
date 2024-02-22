import {clamp, clusterDefaultUser} from '../util'
import {mock} from 'jest-mock-extended'
import {ClusterDescription} from '../types/clusters'

describe('Given a function to clamp a number using an option step discretization', () => {
  describe('when the input is below the minimum', () => {
    it('should be set to the minimum', () => {
      const result = clamp(1, 20, 200)
      expect(result).toBe(20)
    })
  })
  describe('when the input is equal to the minimum', () => {
    it('should be set to the minimum', () => {
      const result = clamp(20, 20, 200)
      expect(result).toBe(20)
    })
  })
  describe('when the input is above the maximum', () => {
    it('should be set to the maximum', () => {
      const result = clamp(201, 20, 200)
      expect(result).toBe(200)
    })
  })
  describe('when the input is equal to the maximum', () => {
    it('should be set to the maximum', () => {
      const result = clamp(200, 20, 200)
      expect(result).toBe(200)
    })
  })
  describe('when the input is not at the step size', () => {
    it('should be set to a multiple of the step size', () => {
      const result = clamp(21, 20, 200, 20)
      expect(result).toBe(20)
    })
  })
})

describe('Given a function to get the default cluster user', () => {
  describe('when the OS is Amazon Linux 2', () => {
    const cluster = {config: {Image: {Os: 'alinux2'}}}
    it('should be ec2-user', () => {
      const result = clusterDefaultUser(cluster)
      expect(result).toBe('ec2-user')
    })
  })

  describe('when the OS is Ubuntu 18.04', () => {
    const cluster = {config: {Image: {Os: 'ubuntu1804'}}}
    it('should be ubuntu', () => {
      const result = clusterDefaultUser(cluster)
      expect(result).toBe('ubuntu')
    })
  })

  describe('when the OS is Ubuntu 20.04', () => {
    const cluster = {config: {Image: {Os: 'ubuntu2004'}}}
    it('should be ubuntu', () => {
      const result = clusterDefaultUser(cluster)
      expect(result).toBe('ubuntu')
    })
  })

  describe('when the OS is Ubuntu 22.04', () => {
    const cluster = {config: {Image: {Os: 'ubuntu2204'}}}
    it('should be ubuntu', () => {
      const result = clusterDefaultUser(cluster)
      expect(result).toBe('ubuntu')
    })
  })

  describe('when the OS is Centos 7', () => {
    const cluster = {config: {Image: {Os: 'centos7'}}}
    it('should be centos', () => {
      const result = clusterDefaultUser(cluster)
      expect(result).toBe('centos')
    })
  })

  describe('when the OS is Rhel 8', () => {
    const cluster = {config: {Image: {Os: 'rhel8'}}}
    it('should be ec2-user', () => {
      const result = clusterDefaultUser(cluster)
      expect(result).toBe('ec2-user')
    })
  })

  describe('when the OS is Rhel 9', () => {
    const cluster = {config: {Image: {Os: 'rhel9'}}}
    it('should be ec2-user', () => {
      const result = clusterDefaultUser(cluster)
      expect(result).toBe('ec2-user')
    })
  })
})
