import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Table, Tag, message, Empty } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import type { FormInstance } from 'antd';

interface User {
  id: number;
  name: string;
  phone: string;
  aadhar: string;
  is_admin: boolean;
}

interface ServiceRequest {
  id: number;
  user_id: number;
  issue: string;
  status: string;
  created_at: string;
  resolved_at?: string;
}

interface ServiceRequestFormValues {
  issue: string;
}

interface ServiceRequestsProps {
  user: User;
}

function ServiceRequests({ user }: ServiceRequestsProps) {
  const [form] = Form.useForm<ServiceRequestFormValues>();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetchServiceRequests();
  }, []);

  const fetchServiceRequests = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/service-requests/user/${user.id}`
      );
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching service requests:', error);
      message.error('Failed to load service requests');
    }
  };

  const handleCreateRequest = async (values: ServiceRequestFormValues) => {
    setLoading(true);
    try {
      const payload = {
        user_id: user.id,
        issue: values.issue,
      };
      await axios.post(`${API_URL}/api/service-requests`, payload);
      message.success('Service request submitted!');
      form.resetFields();
      fetchServiceRequests();
    } catch (error) {
      message.error('Failed to create request');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Issue',
      dataIndex: 'issue',
      key: 'issue',
      width: '60%',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Fixed' ? 'green' : 'orange'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <Card title="Create Service Request" style={{ marginBottom: '20px' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateRequest}
        >
          <Form.Item
            label="Issue Description"
            name="issue"
            rules={[
              { required: true, message: 'Please describe the issue' },
              { min: 5, message: 'Issue description must be at least 5 characters' },
            ]}
          >
            <Input.TextArea
              placeholder="E.g., No water, WiFi not working, etc."
              rows={4}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<PlusOutlined />}
              block
            >
              Submit Request
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="Your Service Requests">
        {requests.length > 0 ? (
          <Table
            dataSource={requests}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 5 }}
          />
        ) : (
          <Empty description="No service requests yet" />
        )}
      </Card>
    </div>
  );
}

export default ServiceRequests;
