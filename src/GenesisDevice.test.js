const GenesisDevice = require('./GenesisDevice');

test('Generate provider', () => {
  const gd = new GenesisDevice();
  gd.addProvider('my_prov', {key: 'abc'}, 'general comment');
  expect(gd.toString()).toBe(`#
# general comment
#
provider \"my_prov\" {
  key = \"abc\"
}
`);
});

test('Generate provider without comment', () => {
  const gd = new GenesisDevice();
  gd.addProvider('my_prov', {key: 'abc'});
  expect(gd.toString()).toBe(`provider \"my_prov\" {
  key = \"abc\"
}
`);
});

test('Generate single variable', () => {
  const gd = new GenesisDevice();
  gd.addVariable('my_var', {default: 'abc'}, 'general comment');
  expect(gd.toString()).toBe(`#
# general comment
#
variable "my_var" {
  default = "abc"
}
`);
});

test('Generate multiple variables', () => {
  const gd = new GenesisDevice('# AUTOGEN');
  gd.addVariable('my_var', {default: 'abc'}, 'general comment');
  gd.addVariable('my_second_var', {default: 123}, 'general comment 2');
  gd.addVariable('my_third_var', {default: false}, 'general comment 3');

  // Note: output should be sorted by variable name.
  expect(gd.toString()).toBe(`# AUTOGEN
#
# general comment 2
#
variable "my_second_var" {
  default = 123
}

#
# general comment 3
#
variable "my_third_var" {
  default = false
}

#
# general comment
#
variable "my_var" {
  default = "abc"
}
`);
});

test('Generate single output', () => {
  const gd = new GenesisDevice();
  gd.addOutput('my_out', {value: 'module.me.test'});
  expect(gd.toString()).toBe(`output "my_out" {
  value = "module.me.test"
}
`);
});

test('Generate complex data resource', () => {
  const gd = new GenesisDevice();
  gd.addData(
      'oci_identity_compartments',
      'my_out',
      {
        count: 1,
        $inlines: [
          [
            'filter',
            {
              name: 'my_filt',
              values: ['comp_name_1', 'comp_name_2'],
            },
          ],
        ],
      },
      'data comment'
  );
  expect(gd.toString()).toBe(`#
# data comment
#
data "oci_identity_compartments" "my_out" {
  count    = 1

  filter {
    name   = "my_filt"
    values = [
      "comp_name_1",
      "comp_name_2"
    ]
  }
}
`);
});

test('Generate complex resource', () => {
  const gd = new GenesisDevice();
  gd.addResource('oci_objectstorage_bucket', 'my_bucket', {
    compartment_id: 'ocid1.23982382932893',
    namespace: 'test_namespace',
  });
  expect(gd.toString()).toBe(`resource "oci_objectstorage_bucket" "my_bucket" {
  compartment_id = "ocid1.23982382932893"
  namespace      = "test_namespace"
}
`);
});

test('Simple example in README.md', () => {
  const gd = new GenesisDevice();
  gd.addResource('aws_vpc', 'regional_vpc', {
    cidr_block: '10.0.0.0/16',
    instance_tenancy: 'default',
    enable_dns_hostnames: true,
    enable_dns_support: true,
  }, [
    'AWS VPC',
    'Create a master VPC for all AZs in the region.',
  ]);
  expect(gd.toString()).toBe(`#
# AWS VPC
# Create a master VPC for all AZs in the region.
#
resource "aws_vpc" "regional_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  instance_tenancy     = "default"
}
`);
});

test('Inlined example in README.md', () => {
  const gd = new GenesisDevice();
  gd.addResource('aws_security_group', 'db_security_group', {
    description: 'Only allow private IP traffic.',
    name: 'db_security_group',
    vpc_id: '${aws_vpc.regional_vpc.id}',
    $inlines: [
      ['ingress', {
        from_port: 0,
        to_port: 0,
        protocol: '-1',
        cidr_blocks: ['10.0.0.0/8'],
      }],
      ['egress', {
        from_port: 0,
        to_port: 0,
        protocol: '-1',
        cidr_blocks: ['10.0.0.0/8'],
      }],
    ],
  }, [
    'AWS Security Group for RDS instances.',
  ]);
  expect(gd.toString()).toBe(`#
# AWS Security Group for RDS instances.
#
resource "aws_security_group" "db_security_group" {
  description = "Only allow private IP traffic."
  name        = "db_security_group"
  vpc_id      = "\${aws_vpc.regional_vpc.id}"

  egress {
    cidr_blocks = [
      "10.0.0.0/8"
    ]
    from_port   = 0
    protocol    = "-1"
    to_port     = 0
  }

  ingress {
    cidr_blocks = [
      "10.0.0.0/8"
    ]
    from_port   = 0
    protocol    = "-1"
    to_port     = 0
  }
}
`);
});
