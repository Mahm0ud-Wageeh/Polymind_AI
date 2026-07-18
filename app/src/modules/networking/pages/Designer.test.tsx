import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router'
import Designer from '@/modules/networking/pages/Designer'

// Mock the designer service so tests never call the real API.
vi.mock('@/services/networking/designerService', () => {
  const mockDesign = {
    summary: 'Enterprise network for 100 employees across 1 building with dual ISP and guest WiFi.',
    topology: {
      layers: [
        { name: 'Core', description: 'High-speed backbone' },
        { name: 'Access', description: 'End-user connectivity' },
      ],
      connections: [
        { from: 'Core-1', to: 'Access-1', medium: '1G fiber' },
      ],
    },
    devices: [
      { name: 'Core-SW-1', role: 'Core Switch', type: 'L3 Switch', modelSuggestion: 'Cisco Catalyst 9500', count: 2, layer: 'Core' },
      { name: 'Access-SW-1', role: 'Access Switch', type: 'L2 Switch', modelSuggestion: 'Cisco Catalyst 9200', count: 4, layer: 'Access' },
    ],
    ipAddressing: {
      strategy: 'VLSM from 10.0.0.0/16',
      subnets: [{ name: 'Users', network: '10.0.30.0/24', mask: '255.255.255.0', vlanId: 30, purpose: 'Employee workstations' }],
    },
    vlanPlan: [{ id: 30, name: 'Users', subnet: '10.0.30.0/24', purpose: 'Employee workstations' }],
    routingPlan: { protocol: 'OSPF', areas: ['Area 0'], details: 'Single area OSPF' },
    security: { firewall: 'Zone-based firewall', dmz: 'Isolated DMZ', acls: ['SSH from mgmt only'] },
    deploymentPlan: [{ phase: 'Phase 1', tasks: ['Deploy core switches'] }],
    rackRecommendations: [{ unit: '42-40', device: 'Core-SW-1' }],
  }

  const mockResponse = {
    id: 'test-id-1',
    name: 'Test Design',
    prompt: 'Design a network',
    status: 'ready',
    summary: mockDesign.summary,
    designData: mockDesign,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return {
    designerService: {
      generate: vi.fn().mockResolvedValue(mockResponse),
      list: vi.fn().mockResolvedValue([mockResponse]),
      get: vi.fn().mockResolvedValue(mockResponse),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  }
})

// Silence console errors from SVG rendering in jsdom.
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

function renderDesigner() {
  return render(
    <BrowserRouter>
      <Designer />
    </BrowserRouter>
  )
}

describe('Designer', () => {
  it('renders the form with title and description', () => {
    renderDesigner()

    expect(screen.getByText('AI Network Designer')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /generate design/i })).toBeInTheDocument()
  })

  it('renders toggle chips for network requirements', () => {
    renderDesigner()

    expect(screen.getByText('Dual ISP')).toBeInTheDocument()
    expect(screen.getByText('VoIP')).toBeInTheDocument()
    expect(screen.getByText('Guest WiFi')).toBeInTheDocument()
    expect(screen.getByText('OSPF')).toBeInTheDocument()
    expect(screen.getByText('Firewall')).toBeInTheDocument()
    expect(screen.getByText('DMZ')).toBeInTheDocument()
  })

  it('renders numeric sliders for buildings and employees', () => {
    renderDesigner()

    const buildingLabels = screen.getAllByText(/buildings/i)
    expect(buildingLabels.some((el) => el.tagName === 'LABEL')).toBe(true)
    const employeeLabels = screen.getAllByText(/employees/i)
    expect(employeeLabels.some((el) => el.tagName === 'LABEL')).toBe(true)

    const sliders = document.querySelectorAll('input[type="range"]')
    expect(sliders.length).toBe(2)
  })

  it('renders example prompt buttons', () => {
    renderDesigner()

    expect(screen.getByText(/3 buildings, 500 employees/i)).toBeInTheDocument()
    expect(screen.getByText(/Campus network with multiple VLANs/i)).toBeInTheDocument()
  })

  it('submit button is enabled when text is entered', async () => {
    const user = userEvent.setup()
    renderDesigner()

    const textarea = screen.getByRole('textbox')
    const submitBtn = screen.getByRole('button', { name: /generate design/i })

    // Before typing: button is disabled
    expect(submitBtn).toBeDisabled()

    // Type a prompt
    await user.type(textarea, 'Design a small office network')

    // After typing: button is enabled
    expect(submitBtn).not.toBeDisabled()
  })
})