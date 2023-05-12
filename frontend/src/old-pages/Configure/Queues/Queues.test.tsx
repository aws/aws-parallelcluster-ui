import {
  allInstancesSupportEFA,
  createComputeResource,
  validateComputeResources,
} from './MultiInstanceComputeResource'

jest.mock('../../../store', () => {
  const originalModule = jest.requireActual('../../../store')
  return {
    __esModule: true,
    ...originalModule,
    setState: jest.fn(),
  }
})

import {setState} from '../../../store'
import {Queues, setSubnetsAndValidate} from './Queues'
import {mock} from 'jest-mock-extended'
import {Store} from '@reduxjs/toolkit'
import {Provider} from 'react-redux'
import {I18nextProvider} from 'react-i18next'
import i18n from '../../../i18n'
import {fireEvent, render} from '@testing-library/react'

afterEach(() => {
  ;(setState as jest.Mock).mockRestore()
})

describe('Given a list of instances', () => {
  const subject = allInstancesSupportEFA
  const efaInstances = new Set<string>(['t2.micro', 't2.medium'])

  describe("when it's empty", () => {
    it('should deactivate EFA', () => {
      expect(subject([], efaInstances)).toBe(false)
    })
  })

  describe('when every instance supports EFA', () => {
    it('should enable EFA', () => {
      expect(
        subject(
          [{InstanceType: 't2.micro'}, {InstanceType: 't2.medium'}],
          efaInstances,
        ),
      ).toBe(true)
    })
  })

  describe('when not every instance supports EFA', () => {
    it('should deactivate EFA', () => {
      expect(
        subject(
          [{InstanceType: 't2.micro'}, {InstanceType: 't2.large'}],
          efaInstances,
        ),
      ).toBe(false)
    })
  })
})

const mockStore = mock<Store>()
const MockProviders = (props: any) => (
  <Provider store={mockStore}>
    <I18nextProvider i18n={i18n}>{props.children}</I18nextProvider>
  </Provider>
)

describe('Given a list of queues', () => {
  describe('when creating a new compute resource', () => {
    it('should create it with a default instance type', () => {
      expect(createComputeResource('queueName', 0).Instances).toHaveLength(1)
    })
  })

  describe.each([
    {version: '3.5.0', maxQueues: 10},
    {version: '3.6.0', maxQueues: 50},
  ])(
    'when the PC version is $version and they are $maxQueues or more',
    ({version, maxQueues}) => {
      beforeEach(() => {
        const queues = new Array(maxQueues).fill(null).map((_, index) => ({
          Name: `queue-${index + 1}`,
          ComputeResources: [],
          ComputeSettings: {
            LocalStorage: {
              RootVolume: {
                VolumeType: 'gp3',
              },
            },
          },
        }))

        mockStore.getState.mockReturnValue({
          aws: {
            subnets: [],
          },
          app: {
            version: {
              full: version,
            },
            wizard: {
              config: {
                Scheduling: {
                  SlurmQueues: queues,
                },
              },
            },
          },
        })
      })
      it('should not allow to add more queues', () => {
        const {getAllByText} = render(
          <MockProviders store={mockStore}>
            <Queues />
          </MockProviders>,
        )

        const button = getAllByText('Add queue')[0]
        fireEvent.click(button)
        expect(setState).not.toHaveBeenCalledWith(
          ['app', 'wizard', 'config', 'Scheduling', 'SlurmQueues'],
          expect.anything(),
        )
      })
    },
  )

  describe.each([
    {version: '3.5.0', maxQueues: 10},
    {version: '3.6.0', maxQueues: 50},
  ])(
    'when the PC version is $version and they are less than $maxQueues',
    ({version, maxQueues}) => {
      const queues = new Array(maxQueues / 2).fill(null).map((_, index) => ({
        Name: `queue-${index + 1}`,
        ComputeResources: [],
        ComputeSettings: {
          LocalStorage: {
            RootVolume: {
              VolumeType: 'gp3',
            },
          },
        },
      }))
      beforeEach(() => {
        mockStore.getState.mockReturnValue({
          aws: {
            subnets: [],
          },
          app: {
            version: {
              full: version,
            },
            wizard: {
              config: {
                Scheduling: {
                  SlurmQueues: queues,
                },
              },
            },
          },
        })
      })
      it('should allow to add more queues', () => {
        const {getAllByText} = render(
          <MockProviders store={mockStore}>
            <Queues />
          </MockProviders>,
        )

        const button = getAllByText('Add queue')[0]
        fireEvent.click(button)
        expect(setState).toHaveBeenCalled()
      })
    },
  )

  describe.each([
    {version: '3.5.0', maxComputeResources: 5},
    {version: '3.6.0', maxComputeResources: 50},
  ])(
    'when the PC version is $version and the compute resources of a queue are $maxComputeResources',
    ({version, maxComputeResources}) => {
      beforeEach(() => {
        mockStore.getState.mockReturnValue({
          aws: {
            subnets: [],
          },
          app: {
            version: {
              full: version,
            },
            wizard: {
              config: {
                Scheduling: {
                  SlurmQueues: [
                    {
                      Name: 'queue-1',
                      ComputeResources: new Array(maxComputeResources)
                        .fill(null)
                        .map(index => ({
                          Name: `cr-${index}`,
                          Instances: [{InstanceType: 'c5n.large'}],
                        })),
                    },
                  ],
                },
              },
            },
          },
        })
      })
      it('should not allow to add more compute resources', () => {
        const {getByText} = render(
          <MockProviders store={mockStore}>
            <Queues />
          </MockProviders>,
        )

        const button = getByText('Add resource')
        fireEvent.click(button)
        expect(setState).not.toHaveBeenCalledWith(
          ['app', 'wizard', 'config', 'Scheduling', 'SlurmQueues', 0],
          expect.anything(),
        )
      })
    },
  )

  describe.each([
    {version: '3.5.0', maxComputeResources: 5},
    {version: '3.6.0', maxComputeResources: 50},
  ])(
    'when the PC version is $version and the compute resources of a queue are less then $maxComputeResources',
    ({version, maxComputeResources}) => {
      beforeEach(() => {
        mockStore.getState.mockReturnValue({
          aws: {
            subnets: [],
          },
          app: {
            version: {
              full: version,
            },
            wizard: {
              config: {
                Scheduling: {
                  SlurmQueues: [
                    {
                      Name: 'queue-1',
                      ComputeResources: new Array(
                        Math.floor(maxComputeResources / 2),
                      )
                        .fill(null)
                        .map(index => ({
                          Name: `cr-${index}`,
                          Instances: [{InstanceType: 'c5n.large'}],
                        })),
                    },
                  ],
                },
              },
            },
          },
        })
      })
      it('should allow to add more compute resources', () => {
        const {getByText} = render(
          <MockProviders store={mockStore}>
            <Queues />
          </MockProviders>,
        )

        const button = getByText('Add resource')
        fireEvent.click(button)
        expect(setState).toHaveBeenCalledWith(
          ['app', 'wizard', 'config', 'Scheduling', 'SlurmQueues', 0],
          expect.anything(),
        )
      })
    },
  )

  describe('when the total compute resources of a cluster are 50', () => {
    beforeEach(() => {
      const queues = new Array(5).fill(null).map((_, index) => ({
        Name: `queue-${index + 1}`,
        ComputeResources: new Array(30).fill(null).map(index => ({
          Name: `cr-${index}`,
          Instances: [{InstanceType: 'c5n.large'}],
        })),
        ComputeSettings: {
          LocalStorage: {
            RootVolume: {
              VolumeType: 'gp3',
            },
          },
        },
      }))

      mockStore.getState.mockReturnValue({
        aws: {
          subnets: [],
        },
        app: {
          version: {
            full: '3.6.0',
          },
          wizard: {
            config: {
              Scheduling: {
                SlurmQueues: queues,
              },
            },
          },
        },
      })
    })
    it('should not allow to add more compute resources', () => {
      const {getAllByText} = render(
        <MockProviders store={mockStore}>
          <Queues />
        </MockProviders>,
      )

      const button = getAllByText('Add resource')[0]
      fireEvent.click(button)
      expect(setState).not.toHaveBeenCalledWith(
        ['app', 'wizard', 'config', 'Scheduling', 'SlurmQueues', 0],
        expect.anything(),
      )
    })
    it('should not allow to add more queues', () => {
      const {getAllByText} = render(
        <MockProviders store={mockStore}>
          <Queues />
        </MockProviders>,
      )

      const button = getAllByText('Add queue')[0]
      fireEvent.click(button)
      expect(setState).not.toHaveBeenCalledWith(
        ['app', 'wizard', 'config', 'Scheduling', 'SlurmQueues'],
        expect.anything(),
      )
    })
  })
})

describe('Given a queue', () => {
  const subject = setSubnetsAndValidate
  describe('when selecting a list of subnets', () => {
    const detail = {selectedOptions: [{value: 'subnet-1'}, {value: 'subnet-2'}]}
    const queueIndex = 0
    const subnetPath = [
      'app',
      'wizard',
      'config',
      'Scheduling',
      'SlurmQueues',
      queueIndex,
      'Networking',
      'SubnetIds',
    ]
    const queueValidate = jest.fn()
    it('should set the correspondent state and validate the queue', () => {
      subject(queueIndex, queueValidate, detail)
      expect(setState).toHaveBeenCalledWith(subnetPath, [
        'subnet-1',
        'subnet-2',
      ])
      expect(queueValidate).toHaveBeenCalledWith(queueIndex)
    })
  })

  const basicHeadNodeSubnetConfig: any = {
    aws: {
      subnets: [],
    },
    app: {
      version: {
        full: '3.4.0',
      },
      wizard: {
        config: {
          HeadNode: {
            Networking: {
              SubnetId: 'test-subnet',
            },
          },
          Scheduling: {
            SlurmQueues: [
              {
                Name: `queue-1`,
                ComputeResources: [
                  {
                    Instances: [{InstanceType: 'hpc6a.48xlarge'}],
                  },
                ],
              },
            ],
          },
        },
      },
    },
  }

  describe('when the queues page is loaded', () => {
    describe('when the queue has no subnet set', () => {
      beforeEach(() => {
        mockStore.getState.mockReturnValue(basicHeadNodeSubnetConfig)
      })
      it('should set the queue subnet the same as the headnode subnet', () => {
        render(
          <MockProviders store={mockStore}>
            <Queues />
          </MockProviders>,
        )

        expect(setState).toHaveBeenCalledWith(
          [
            'app',
            'wizard',
            'config',
            'Scheduling',
            'SlurmQueues',
            0,
            'Networking',
            'SubnetIds',
          ],
          ['test-subnet'],
        )
      })
    })
  })

  describe('when the queue has already a subnet set', () => {
    beforeEach(() => {
      const state = {...basicHeadNodeSubnetConfig}
      state.app.wizard.config.Scheduling.SlurmQueues[0].Networking = {
        SubnetIds: ['test-subnet'],
      }
      mockStore.getState.mockReturnValue(state)
    })
    it('should not modify it', () => {
      render(
        <MockProviders store={mockStore}>
          <Queues />
        </MockProviders>,
      )

      expect(setState).not.toHaveBeenCalledWith(
        [
          'app',
          'wizard',
          'config',
          'Scheduling',
          'SlurmQueues',
          0,
          'Networking',
          'SubnetIds',
        ],
        expect.anything(),
      )
    })
  })

  describe('when an HPC instance is selected', () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        aws: {
          subnets: [],
        },
        app: {
          version: {
            full: '3.4.0',
          },
          wizard: {
            config: {
              Scheduling: {
                SlurmQueues: [
                  {
                    Name: `queue-1`,
                    ComputeResources: [
                      {
                        Instances: [{InstanceType: 'hpc6a.48xlarge'}],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      })
    })
    it('should not let the user select multithreading options', () => {
      const {getByText} = render(
        <MockProviders store={mockStore}>
          <Queues />
        </MockProviders>,
      )

      const multithreadingCheckbox = getByText('Turn off multithreading')
      fireEvent.click(multithreadingCheckbox)
      expect(setState).not.toHaveBeenCalledWith(
        [
          'app',
          'wizard',
          'config',
          'Scheduling',
          'SlurmQueues',
          0,
          'ComputeResources',
          0,
          'DisableSimultaneousMultithreading',
        ],
        true,
      )
    })
  })

  describe('when an HPC instance is not selected', () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        aws: {
          subnets: [],
        },
        app: {
          version: {
            full: '3.4.0',
          },
          wizard: {
            config: {
              Scheduling: {
                SlurmQueues: [
                  {
                    Name: `queue-1`,
                    ComputeResources: [
                      {
                        Instances: [{InstanceType: 'c5n.large'}],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      })
    })
    it('should let the user select multithreading options', () => {
      const {getByText} = render(
        <MockProviders store={mockStore}>
          <Queues />
        </MockProviders>,
      )

      const multithreadingCheckbox = getByText('Turn off multithreading')
      fireEvent.click(multithreadingCheckbox)
      expect(setState).toHaveBeenCalledWith(
        [
          'app',
          'wizard',
          'config',
          'Scheduling',
          'SlurmQueues',
          0,
          'ComputeResources',
          0,
          'DisableSimultaneousMultithreading',
        ],
        true,
      )
    })
  })
})

describe('Given a list of compute resources', () => {
  const subject = validateComputeResources
  describe('when all of them have at least one instance type', () => {
    it('should not return an error', () => {
      const [valid] = subject([
        {
          Name: 'test1',
          MinCount: 0,
          MaxCount: 2,
          Instances: [{InstanceType: 't2.micro'}, {InstanceType: 't2.medium'}],
        },
        {
          Name: 'test2',
          MinCount: 0,
          MaxCount: 2,
          Instances: [{InstanceType: 't2.micro'}],
        },
      ])

      expect(valid).toBe(true)
    })
  })

  describe('when one of these compute resources has no instance types', () => {
    it('should return a validation error', () => {
      const [valid, errors] = subject([
        {
          Name: 'test1',
          MinCount: 0,
          MaxCount: 2,
          Instances: [{InstanceType: 't2.micro'}, {InstanceType: 't2.medium'}],
        },
        {
          Name: 'test2',
          MinCount: 0,
          MaxCount: 2,
          Instances: [],
        },
      ])

      expect(valid).toBe(false)
      expect(errors[1]).toBe('instance_types_empty')
    })
  })
})
