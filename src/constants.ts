export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type Status = 'Struggling' | 'Progressing' | 'Completed';

export interface ComponentInfo {
  id: string;
  name: string;
  description: string;
  pins: string[];
  commonMistakes: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  subject: string;
  difficulty: Difficulty;
  components: ComponentInfo[];
  tags: string[];
}

export interface StudentProgress {
  projectId: string;
  status: Status;
  errors: string[];
  successes: string[];
  lastUpdated: string;
}

export interface Student {
  id: string;
  name: string;
  progress: StudentProgress[];
}

export interface WiringSuggestion {
  componentPin: string;
  arduinoPin: string;
  note?: string;
  breadboardCoords?: string; // e.g., "Row A, Col 10"
}

export interface WireSuggestion {
  type: 'Male-to-Male' | 'Female-to-Female' | 'Male-to-Female';
  count: number;
  reason: string;
}

export interface CustomConnection {
  compId: string;
  compPin: string;
  arduinoPin: string;
  breadboardCoords?: string;
}

export interface AIResult {
  connections: CustomConnection[];
  code: string;
  wires: WireSuggestion[];
  breadboardGuide?: string; // General instructions for breadboard layout
}

export interface SavedProject {
  id: string;
  name: string;
  timestamp: number;
  selectedComponentIds: string[];
  intent: string;
  result: AIResult;
}

export interface PopularComponent {
  id: string;
  name: string;
  icon: string;
  description: string;
  wiring: WiringSuggestion[];
  extraParts?: string[];
}

export const POPULAR_COMPONENTS: PopularComponent[] = [
  {
    id: 'led',
    name: 'LED',
    icon: 'Zap',
    description: 'Light Emitting Diode - basic light output.',
    wiring: [
      { componentPin: 'Anode (Long Leg)', arduinoPin: 'Digital Pin (e.g., D13)', note: 'Connect via 220Ω resistor' },
      { componentPin: 'Cathode (Short Leg)', arduinoPin: 'GND' }
    ],
    extraParts: ['220Ω Resistor']
  },
  {
    id: 'resistor-330',
    name: '330Ω Resistor',
    icon: 'Hash',
    description: 'Current limiting resistor for LEDs and small circuits.',
    wiring: [
      { componentPin: 'Side A', arduinoPin: 'Any' },
      { componentPin: 'Side B', arduinoPin: 'Any' }
    ]
  },
  {
    id: 'breadboard',
    name: 'Breadboard',
    icon: 'Grid',
    description: 'Solderless board for prototyping circuits.',
    wiring: []
  },
  {
    id: 'dc-motor',
    name: 'DC Motor',
    icon: 'RotateCw',
    description: 'Standard motor for rotation. Requires a driver.',
    wiring: [
      { componentPin: 'Terminal 1', arduinoPin: 'Motor Driver Output' },
      { componentPin: 'Terminal 2', arduinoPin: 'Motor Driver Output' }
    ],
    extraParts: ['Motor Driver']
  },
  {
    id: 'motor-driver',
    name: 'Motor Driver',
    icon: 'Cpu',
    description: 'L298N or similar to control high-power motors.',
    wiring: [
      { componentPin: 'IN1', arduinoPin: 'D2' },
      { componentPin: 'IN2', arduinoPin: 'D3' },
      { componentPin: 'ENA', arduinoPin: 'D9 (PWM)' },
      { componentPin: 'VCC', arduinoPin: 'External Battery' },
      { componentPin: 'GND', arduinoPin: 'GND (Common)' }
    ]
  },
  {
    id: 'ldr',
    name: 'LDR',
    icon: 'Sun',
    description: 'Light Dependent Resistor - detects light levels.',
    wiring: [
      { componentPin: 'Pin 1', arduinoPin: '5V' },
      { componentPin: 'Pin 2', arduinoPin: 'Analog Pin (e.g., A0)', note: 'Use 10kΩ resistor to GND' }
    ],
    extraParts: ['10kΩ Resistor']
  },
  {
    id: 'ir-sensor',
    name: 'IR Sensor',
    icon: 'Eye',
    description: 'Infrared proximity or obstacle sensor.',
    wiring: [
      { componentPin: 'VCC', arduinoPin: '5V' },
      { componentPin: 'GND', arduinoPin: 'GND' },
      { componentPin: 'OUT', arduinoPin: 'Digital Pin (e.g., D2)' }
    ]
  },
  {
    id: 'water-level',
    name: 'Water Level',
    icon: 'Droplets',
    description: 'Detects the presence and level of water.',
    wiring: [
      { componentPin: '+', arduinoPin: '5V' },
      { componentPin: '-', arduinoPin: 'GND' },
      { componentPin: 'S (Signal)', arduinoPin: 'Analog Pin (e.g., A0)' }
    ]
  },
  {
    id: 'ultrasonic',
    name: 'HC-SR04',
    icon: 'Radio',
    description: 'Ultrasonic distance sensor.',
    wiring: [
      { componentPin: 'VCC', arduinoPin: '5V' },
      { componentPin: 'Trig', arduinoPin: 'Digital Pin (e.g., D9)' },
      { componentPin: 'Echo', arduinoPin: 'Digital Pin (e.g., D10)' },
      { componentPin: 'GND', arduinoPin: 'GND' }
    ]
  },
  {
    id: 'color-sensor',
    name: 'Color Sensor',
    icon: 'Palette',
    description: 'TCS3200 - detects RGB color values.',
    wiring: [
      { componentPin: 'VCC', arduinoPin: '5V' },
      { componentPin: 'GND', arduinoPin: 'GND' },
      { componentPin: 'S0/S1', arduinoPin: '5V/GND (Scaling)' },
      { componentPin: 'OUT', arduinoPin: 'Digital Pin (e.g., D4)' }
    ]
  },
  {
    id: 'speaker',
    name: 'Speaker',
    icon: 'Volume2',
    description: 'Audio output for music or tones.',
    wiring: [
      { componentPin: '+', arduinoPin: 'Digital Pin (via Cap)' },
      { componentPin: '-', arduinoPin: 'GND' }
    ],
    extraParts: ['10uF Capacitor']
  },
  {
    id: 'buzzer',
    name: 'Buzzer',
    icon: 'Bell',
    description: 'Simple piezo for beeps and alarms.',
    wiring: [
      { componentPin: '+', arduinoPin: 'Digital Pin (e.g., D8)' },
      { componentPin: '-', arduinoPin: 'GND' }
    ]
  },
  {
    id: 'dfplayer',
    name: 'DFPlayer Mini',
    icon: 'Music',
    description: 'MP3 player module for Arduino.',
    wiring: [
      { componentPin: 'VCC', arduinoPin: '5V' },
      { componentPin: 'RX', arduinoPin: 'D11 (via 1kΩ Res)' },
      { componentPin: 'TX', arduinoPin: 'D10' },
      { componentPin: 'GND', arduinoPin: 'GND' }
    ],
    extraParts: ['1kΩ Resistor', 'MicroSD Card']
  },
  {
    id: 'joystick',
    name: 'Joystick',
    icon: 'Gamepad2',
    description: '2-axis analog stick with button.',
    wiring: [
      { componentPin: 'VCC', arduinoPin: '5V' },
      { componentPin: 'GND', arduinoPin: 'GND' },
      { componentPin: 'VRx', arduinoPin: 'A0' },
      { componentPin: 'VRy', arduinoPin: 'A1' },
      { componentPin: 'SW', arduinoPin: 'D2' }
    ]
  },
  {
    id: 'gas-sensor',
    name: 'Gas Sensor',
    icon: 'Wind',
    description: 'MQ-2 - detects smoke, LPG, and CO.',
    wiring: [
      { componentPin: 'VCC', arduinoPin: '5V' },
      { componentPin: 'GND', arduinoPin: 'GND' },
      { componentPin: 'AO', arduinoPin: 'Analog Pin (e.g., A0)' }
    ]
  },
  {
    id: 'laser',
    name: 'Laser Module',
    icon: 'Target',
    description: 'Low power red laser diode.',
    wiring: [
      { componentPin: 'VCC', arduinoPin: '5V' },
      { componentPin: 'GND', arduinoPin: 'GND' },
      { componentPin: 'S (Signal)', arduinoPin: 'Digital Pin' }
    ]
  },
  {
    id: 'vibrator',
    name: 'Vibration Motor',
    icon: 'Activity',
    description: 'Small motor for haptic feedback.',
    wiring: [
      { componentPin: '+', arduinoPin: 'Digital Pin' },
      { componentPin: '-', arduinoPin: 'GND' }
    ]
  },
  {
    id: 'pump-motor',
    name: 'Pump Motor',
    icon: 'Waves',
    description: 'Submersible pump for water projects.',
    wiring: [
      { componentPin: '+', arduinoPin: 'Relay/Driver Output' },
      { componentPin: '-', arduinoPin: 'GND' }
    ],
    extraParts: ['Relay or Motor Driver']
  },
  {
    id: 'relay',
    name: 'Relay',
    icon: 'ToggleRight',
    description: 'Switch for high-voltage or high-current loads.',
    wiring: [
      { componentPin: 'VCC', arduinoPin: '5V' },
      { componentPin: 'GND', arduinoPin: 'GND' },
      { componentPin: 'IN', arduinoPin: 'Digital Pin (e.g., D7)' }
    ]
  },
  {
    id: 'arduino-uno',
    name: 'Arduino Uno',
    icon: 'Cpu',
    description: 'The most popular microcontroller for beginners.',
    wiring: [
      { componentPin: 'USB', arduinoPin: 'Computer' },
      { componentPin: 'Barrel Jack', arduinoPin: '7-12V Power' }
    ]
  },
  {
    id: 'esp32',
    name: 'ESP32',
    icon: 'Wifi',
    description: 'Powerful microcontroller with built-in Wi-Fi and Bluetooth.',
    wiring: [
      { componentPin: 'VCC', arduinoPin: '3.3V' },
      { componentPin: 'GND', arduinoPin: 'GND' },
      { componentPin: 'EN', arduinoPin: 'Reset Button' }
    ]
  },
  {
    id: 'dht11',
    name: 'DHT11',
    icon: 'Thermometer',
    description: 'Basic digital temperature and humidity sensor.',
    wiring: [
      { componentPin: 'VCC', arduinoPin: '5V' },
      { componentPin: 'GND', arduinoPin: 'GND' },
      { componentPin: 'DATA', arduinoPin: 'Digital Pin (e.g., D2)', note: 'Use 10kΩ pull-up resistor' }
    ],
    extraParts: ['10kΩ Resistor']
  },
  {
    id: 'pir-sensor',
    name: 'PIR Sensor',
    icon: 'Move',
    description: 'Passive Infrared sensor for motion detection.',
    wiring: [
      { componentPin: 'VCC', arduinoPin: '5V' },
      { componentPin: 'GND', arduinoPin: 'GND' },
      { componentPin: 'OUT', arduinoPin: 'Digital Pin (e.g., D2)' }
    ]
  },
  {
    id: 'soil-moisture',
    name: 'Soil Moisture',
    icon: 'Sprout',
    description: 'Measures the volumetric content of water in soil.',
    wiring: [
      { componentPin: 'VCC', arduinoPin: '5V' },
      { componentPin: 'GND', arduinoPin: 'GND' },
      { componentPin: 'AO', arduinoPin: 'Analog Pin (e.g., A0)' }
    ]
  },
  {
    id: 'mpu6050',
    name: 'MPU6050',
    icon: 'Compass',
    description: '6-axis Gyroscope and Accelerometer (I2C).',
    wiring: [
      { componentPin: 'VCC', arduinoPin: '3.3V' },
      { componentPin: 'GND', arduinoPin: 'GND' },
      { componentPin: 'SCL', arduinoPin: 'A5 (Uno) / SCL' },
      { componentPin: 'SDA', arduinoPin: 'A4 (Uno) / SDA' }
    ]
  },
  {
    id: 'servo-motor',
    name: 'Servo Motor',
    icon: 'RotateCcw',
    description: 'Precise position control motor (0-180 degrees).',
    wiring: [
      { componentPin: 'Red (VCC)', arduinoPin: '5V' },
      { componentPin: 'Brown (GND)', arduinoPin: 'GND' },
      { componentPin: 'Orange (PWM)', arduinoPin: 'Digital Pin (e.g., D9)' }
    ]
  },
  {
    id: 'stepper-motor',
    name: 'Stepper Motor',
    icon: 'RefreshCw',
    description: '28BYJ-48 with ULN2003 driver for precise rotation.',
    wiring: [
      { componentPin: 'IN1-IN4', arduinoPin: 'D8, D9, D10, D11' },
      { componentPin: 'VCC', arduinoPin: '5V (External recommended)' },
      { componentPin: 'GND', arduinoPin: 'GND' }
    ],
    extraParts: ['ULN2003 Driver']
  },
  {
    id: 'lcd-i2c',
    name: 'I2C LCD 16x2',
    icon: 'Monitor',
    description: 'Liquid Crystal Display using only 2 wires (I2C).',
    wiring: [
      { componentPin: 'VCC', arduinoPin: '5V' },
      { componentPin: 'GND', arduinoPin: 'GND' },
      { componentPin: 'SDA', arduinoPin: 'A4' },
      { componentPin: 'SCL', arduinoPin: 'A5' }
    ]
  },
  {
    id: 'keypad',
    name: '4x4 Keypad',
    icon: 'Keyboard',
    description: 'Matrix keypad for user input.',
    wiring: [
      { componentPin: 'R1-R4', arduinoPin: 'D9, D8, D7, D6' },
      { componentPin: 'C1-C4', arduinoPin: 'D5, D4, D3, D2' }
    ]
  },
  {
    id: 'rotary-encoder',
    name: 'Rotary Encoder',
    icon: 'Settings2',
    description: 'Infinite rotation knob with push button.',
    wiring: [
      { componentPin: 'CLK', arduinoPin: 'D2 (Interrupt)' },
      { componentPin: 'DT', arduinoPin: 'D3' },
      { componentPin: 'SW', arduinoPin: 'D4' },
      { componentPin: 'VCC', arduinoPin: '5V' },
      { componentPin: 'GND', arduinoPin: 'GND' }
    ]
  }
];

export const PROJECTS: Project[] = [
  {
    id: "ultrasonic",
    name: "Ultrasonic Distance Sensor",
    description: "Build a device that measures distance using ultrasonic waves and displays it on a serial monitor.",
    subject: "Electronics",
    difficulty: "Intermediate",
    tags: ["Arduino", "Sensors", "C++"],
    components: [
      {
        id: "hc-sr04",
        name: "HC-SR04 Sensor",
        description: "Measures distance using sonar waves.",
        pins: ["VCC (5V)", "Trig (Digital Pin)", "Echo (Digital Pin)", "GND"],
        commonMistakes: ["Reversed VCC and GND", "Echo pin connected to non-PWM pin", "Sensor facing a soft surface"]
      },
      {
        id: "arduino",
        name: "Arduino Uno",
        description: "The brain of the project.",
        pins: ["5V", "GND", "D9 (Trig)", "D10 (Echo)"],
        commonMistakes: ["Using the wrong GND pin", "USB cable not fully inserted", "Incorrect board selected"]
      }
    ]
  },
  {
    id: "led-blink",
    name: "Simple LED Circuit",
    description: "The classic first project: make an LED blink using a breadboard and a power source.",
    subject: "Electronics",
    difficulty: "Beginner",
    tags: ["Basic", "Circuit", "LED"],
    components: [
      {
        id: "led",
        name: "LED",
        description: "Light Emitting Diode.",
        pins: ["Anode (+)", "Cathode (-)"],
        commonMistakes: ["Reversed polarity", "Missing resistor", "Burned out LED"]
      },
      {
        id: "resistor",
        name: "220 Ohm Resistor",
        description: "Limits current to protect the LED.",
        pins: ["Side A", "Side B"],
        commonMistakes: ["Using wrong resistance", "Shorting the legs"]
      }
    ]
  },
  {
    id: "smart-plant",
    name: "Smart Plant Watering System",
    description: "Create an automated system that monitors soil moisture and waters your plant when it's thirsty.",
    subject: "Agriculture Tech",
    difficulty: "Advanced",
    tags: ["IoT", "Automation", "Sustainability"],
    components: [
      {
        id: "soil-moisture",
        name: "Soil Moisture Sensor",
        description: "Detects water levels in soil.",
        pins: ["VCC", "GND", "AO"],
        commonMistakes: ["Corrosion due to constant power", "Incorrect calibration"]
      },
      {
        id: "pump-motor",
        name: "Submersible Pump",
        description: "Moves water to the plant.",
        pins: ["VCC", "GND"],
        commonMistakes: ["Running dry", "Connecting directly to Arduino pins"]
      }
    ]
  },
  {
    id: "weather-station",
    name: "IoT Weather Station",
    description: "Build a station that tracks temperature and humidity, displaying data locally and online.",
    subject: "Environmental Science",
    difficulty: "Intermediate",
    tags: ["ESP32", "Data", "WiFi"],
    components: [
      {
        id: "dht11",
        name: "DHT11 Sensor",
        description: "Measures temperature and humidity.",
        pins: ["VCC", "GND", "DATA"],
        commonMistakes: ["Reading too frequently", "Wrong pull-up resistor"]
      },
      {
        id: "lcd-i2c",
        name: "I2C LCD",
        description: "Displays real-time data.",
        pins: ["VCC", "GND", "SDA", "SCL"],
        commonMistakes: ["Incorrect I2C address", "Contrast knob not adjusted"]
      }
    ]
  },
  {
    id: "motion-alarm",
    name: "Motion-Activated Security Alarm",
    description: "Secure your room with a system that sounds an alarm and flashes lights when motion is detected.",
    subject: "Security Systems",
    difficulty: "Beginner",
    tags: ["Safety", "Sensors", "Buzzer"],
    components: [
      {
        id: "pir-sensor",
        name: "PIR Motion Sensor",
        description: "Detects human movement.",
        pins: ["VCC", "GND", "OUT"],
        commonMistakes: ["Sensitivity set too high", "Not waiting for warm-up time"]
      },
      {
        id: "buzzer",
        name: "Active Buzzer",
        description: "Sounds the alarm.",
        pins: ["+", "-"],
        commonMistakes: ["Reversed polarity"]
      }
    ]
  }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: "1",
    name: "Alex Rivera",
    progress: [
      {
        projectId: "led-blink",
        status: "Completed",
        errors: ["Reversed LED polarity initially"],
        successes: ["Understood resistor color codes quickly"],
        lastUpdated: new Date().toISOString()
      }
    ]
  },
  {
    id: "2",
    name: "Sam Chen",
    progress: [
      {
        projectId: "ultrasonic",
        status: "Progressing",
        errors: ["Confusion between Trig and Echo pins"],
        successes: ["Successfully calibrated the sensor code"],
        lastUpdated: new Date().toISOString()
      }
    ]
  }
];
