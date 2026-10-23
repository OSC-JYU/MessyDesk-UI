import nodes from '@/assets/images/nodes.jpg'
import system from '@/assets/images/system.jpg'

// Content of the introduction tour.
export const introSlides = [
  {
    title: 'What is MessyDesk?',
    lead: 'Two functions of MessyDesk',
    image: nodes,
    imageAlt: 'A MessyDesk desk with files and the processing steps applied to them',
    cards: [
      {
        title: 'Open playground for digital humanities',
        subtitle: ['Try easily, fail early'],
        paragraphs: ["You don't have to set up any tools. Just upload your files and get started."],
      },
      {
        title: 'Pre-research tools for file processing',
        subtitle: ['Do your research, not things that can be automated'],
        paragraphs: ['Auto-rotate your text scans, scale images, do OCR, etc.'],
      },
    ],
  },
  {
    title: 'Design',
    lead: 'Two challenges of MessyDesk',
    image: system,
    imageAlt: 'MessyDesk system architecture: UI, API, graph database, message stream and services',
    cards: [
      {
        title: 'User interface design',
        subtitle: [
          'How to support chains of operations?',
          'How to allow testing with different parameters?',
        ],
        paragraphs: [],
      },
      {
        title: 'Service architecture design',
        subtitle: ['How to combine separate tools into a uniform interface?'],
        paragraphs: [],
      },
    ],
  },
  {
    title: 'User interface',
    lead: 'Nodes to the rescue',
    image: nodes,
    imageAlt: 'Files shown as nodes, linked to the steps that produced them',
    cards: [
      {
        title: 'History view',
        subtitle: ['Non-scary node view'],
        paragraphs: [
          'A node-based UI can show complex workflows. However, it can be scary and, indeed, annoying.',
          'To avoid this, MessyDesk uses nodes to show the history of files.',
        ],
      },
      {
        title: 'Service architecture',
        subtitle: ['How to combine separate tools into a uniform interface?'],
        paragraphs: [],
      },
    ],
  },
]
