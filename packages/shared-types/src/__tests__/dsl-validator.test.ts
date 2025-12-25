import { DSLValidator } from '../dsl-validator';
import type { ModelDSL, PageDSL, LogicDSL, WorkflowDSL } from '../index';

describe('DSLValidator', () => {
  let validator: DSLValidator;

  beforeEach(() => {
    validator = new DSLValidator();
  });

  describe('Model DSL Validation', () => {
    it('should validate a valid Model DSL', () => {
      const validModel: ModelDSL = {
        id: 'hidden_danger_v1',
        version: '1.0.0',
        entityName: 'HiddenDanger',
        displayName: '隐患单',
        description: '现场隐患排查上报',
        timestamps: true,
        fields: [
          {
            key: 'level',
            label: '隐患等级',
            type: 'enum',
            required: true,
            options: [
              { label: '一般', value: 'normal' },
              { label: '重大', value: 'critical' },
            ],
          },
          {
            key: 'status',
            label: '状态',
            type: 'enum',
            options: [
              { label: '草稿', value: 'draft' },
              { label: '已提交', value: 'submitted' },
            ],
          },
        ],
        relations: [
          {
            type: 'belongsTo',
            target: 'User',
            foreignKey: 'reporterId',
            as: 'reporter',
          },
        ],
      };

      const result = validator.validate('model', validModel);
      expect(result.valid).toBe(true);
    });

    it('should reject Model DSL with missing required fields', () => {
      const invalidModel = {
        id: 'test',
        version: '1.0.0',
        // missing entityName, displayName, fields, relations
      };

      const result = validator.validate('model', invalidModel);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it('should reject relation without foreignKey', () => {
      const invalidModel: any = {
        id: 'test_v1',
        version: '1.0.0',
        entityName: 'Test',
        displayName: '测试',
        fields: [],
        relations: [
          {
            type: 'belongsTo',
            target: 'User',
            // missing foreignKey
          },
        ],
      };

      const result = validator.validate('model', invalidModel);
      expect(result.valid).toBe(false);
    });
  });

  describe('Page DSL Validation', () => {
    it('should validate a valid Page DSL', () => {
      const validPage: PageDSL = {
        id: 'page_danger_create_v1',
        version: '1.0.0',
        name: '隐患上报',
        layout: 'default',
        components: [
          {
            id: 'form_1',
            type: 'Form',
            props: {
              layout: 'vertical',
            },
            children: [
              {
                id: 'level_input',
                type: 'Select',
                props: {
                  label: '隐患等级',
                  field: 'level',
                },
              },
            ],
          },
          {
            id: 'submit_btn',
            type: 'Button',
            props: {
              text: '提交',
            },
            events: {
              onClick: 'submitForm',
            },
          },
        ],
      };

      const result = validator.validate('page', validPage);
      expect(result.valid).toBe(true);
    });

    it('should reject Page DSL with missing required fields', () => {
      const invalidPage = {
        id: 'test',
        version: '1.0.0',
        // missing name, layout, components
      };

      const result = validator.validate('page', invalidPage);
      expect(result.valid).toBe(false);
    });
  });

  describe('Logic DSL Validation', () => {
    it('should validate a valid Logic DSL', () => {
      const validLogic: LogicDSL = {
        id: 'logic_submit_v1',
        version: '1.0.0',
        name: '提交逻辑',
        events: {
          onSubmit: [
            {
              action: 'validateForm',
              params: { formId: 'form_1' },
              then: [
                {
                  action: 'submitData',
                  params: { endpoint: '/api/dangers' },
                },
              ],
              catch: [
                {
                  action: 'showError',
                  params: { message: '提交失败' },
                },
              ],
            },
          ],
        },
      };

      const result = validator.validate('logic', validLogic);
      expect(result.valid).toBe(true);
    });
  });

  describe('Workflow DSL Validation', () => {
    it('should validate a valid Workflow DSL', () => {
      const validWorkflow: WorkflowDSL = {
        id: 'workflow_approval_v1',
        version: '1.0.0',
        name: '隐患审批流程',
        nodes: [
          {
            id: 'start',
            type: 'Start',
            label: '开始',
          },
          {
            id: 'task_approve',
            type: 'Task',
            label: '班组长审批',
            props: {
              assignee: 'teamLeader',
            },
          },
          {
            id: 'end',
            type: 'End',
            label: '结束',
          },
        ],
        edges: [
          {
            id: 'edge_1',
            source: 'start',
            target: 'task_approve',
          },
          {
            id: 'edge_2',
            source: 'task_approve',
            target: 'end',
            condition: 'approved === true',
          },
        ],
      };

      const result = validator.validate('workflow', validWorkflow);
      expect(result.valid).toBe(true);
    });
  });
});
