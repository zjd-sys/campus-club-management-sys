import { useEffect, useState, useCallback } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, Popconfirm, message } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import {
  getGrades,
  createGrade,
  deleteGrade,
  getClazzes,
  createClazz,
  deleteClazz
} from '../api'

export default function Structure() {
  const [grades, setGrades] = useState([])
  const [gradeLoading, setGradeLoading] = useState(false)
  const [gradeModal, setGradeModal] = useState(false)
  const [gradeForm] = Form.useForm()

  const [selectedGrade, setSelectedGrade] = useState(undefined)
  const [clazzes, setClazzes] = useState([])
  const [clazzLoading, setClazzLoading] = useState(false)
  const [clazzModal, setClazzModal] = useState(false)
  const [clazzForm] = Form.useForm()

  const loadGrades = useCallback(async () => {
    setGradeLoading(true)
    try {
      const g = await getGrades()
      setGrades(g || [])
      if (!selectedGrade && (g || []).length) {
        setSelectedGrade(g[0].id)
      }
    } catch (e) {
      // ignore
    } finally {
      setGradeLoading(false)
    }
  }, [selectedGrade])

  const loadClazzes = useCallback(
    async (gradeId) => {
      if (!gradeId) {
        setClazzes([])
        return
      }
      setClazzLoading(true)
      try {
        const c = await getClazzes(gradeId)
        setClazzes(c || [])
      } catch (e) {
        setClazzes([])
      } finally {
        setClazzLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    loadGrades()
  }, [loadGrades])

  useEffect(() => {
    if (selectedGrade) loadClazzes(selectedGrade)
  }, [selectedGrade, loadClazzes])

  const handleCreateGrade = async () => {
    const { name } = await gradeForm.validateFields()
    try {
      await createGrade(name)
      message.success('年级创建成功')
      setGradeModal(false)
      gradeForm.resetFields()
      loadGrades()
    } catch (e) {
      // ignore
    }
  }

  const handleDeleteGrade = async (id) => {
    try {
      await deleteGrade(id)
      message.success('年级已删除')
      loadGrades()
    } catch (e) {
      // ignore
    }
  }

  const handleCreateClazz = async () => {
    const { name } = await clazzForm.validateFields()
    if (!selectedGrade) {
      message.error('请先选择年级')
      return
    }
    try {
      await createClazz(selectedGrade, name)
      message.success('班级创建成功')
      setClazzModal(false)
      clazzForm.resetFields()
      loadClazzes(selectedGrade)
    } catch (e) {
      // ignore
    }
  }

  const handleDeleteClazz = async (id) => {
    try {
      await deleteClazz(id)
      message.success('班级已删除')
      loadClazzes(selectedGrade)
    } catch (e) {
      // ignore
    }
  }

  const gradeColumns = [
    { title: '年级名称', dataIndex: 'name', key: 'name' },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, r) => (
        <Popconfirm title="确认删除该年级？" onConfirm={() => handleDeleteGrade(r.id)}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      )
    }
  ]

  const clazzColumns = [
    { title: '班级名称', dataIndex: 'name', key: 'name' },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, r) => (
        <Popconfirm title="确认删除该班级？" onConfirm={() => handleDeleteClazz(r.id)}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      )
    }
  ]

  return (
    <div>
      <div className="admin-module-title">年级班级</div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div className="admin-module" style={{ flex: '1 1 360px' }}>
          <div className="admin-toolbar">
            <strong>年级</strong>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setGradeModal(true)}
              style={{ marginLeft: 'auto' }}
            >
              新增年级
            </Button>
          </div>
          <Table
            rowKey="id"
            columns={gradeColumns}
            dataSource={grades}
            loading={gradeLoading}
            pagination={false}
            onRow={(record) => ({
              onClick: () => setSelectedGrade(record.id),
              style: { cursor: 'pointer', background: record.id === selectedGrade ? '#e6f4ff' : '' }
            })}
          />
        </div>

        <div className="admin-module" style={{ flex: '1 1 360px' }}>
          <div className="admin-toolbar">
            <strong>班级</strong>
            <Select
              placeholder="选择年级"
              style={{ width: 160 }}
              value={selectedGrade}
              onChange={setSelectedGrade}
              options={grades.map((g) => ({ label: g.name, value: g.id }))}
            />
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setClazzModal(true)}
              disabled={!selectedGrade}
              style={{ marginLeft: 'auto' }}
            >
              新增班级
            </Button>
          </div>
          <Table
            rowKey="id"
            columns={clazzColumns}
            dataSource={clazzes}
            loading={clazzLoading}
            pagination={false}
          />
        </div>
      </div>

      <Modal
        title="新增年级"
        open={gradeModal}
        onCancel={() => setGradeModal(false)}
        onOk={handleCreateGrade}
        destroyOnClose
      >
        <Form form={gradeForm} layout="vertical">
          <Form.Item name="name" label="年级名称" rules={[{ required: true, message: '请输入年级名称' }]}>
            <Input placeholder="如：高一" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新增班级"
        open={clazzModal}
        onCancel={() => setClazzModal(false)}
        onOk={handleCreateClazz}
        destroyOnClose
      >
        <Form form={clazzForm} layout="vertical">
          <Form.Item name="name" label="班级名称" rules={[{ required: true, message: '请输入班级名称' }]}>
            <Input placeholder="如：1班" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
