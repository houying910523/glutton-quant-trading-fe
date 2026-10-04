import {
  Button,
  Collapse,
  Divider,
  Form,
  Grid,
  Input,
  Layout,
  Radio,
  Select,
  Tooltip,
  Typography
} from "@arco-design/web-react";
import {ReactNode, useEffect, useState} from "react";
import {Api} from "@/asset/api";
import parse from 'html-react-parser';
import {LabeledValue} from "@arco-design/web-react/es/Select/interface";

const { Text } = Typography;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;

type ParamsProperty = {
  name: string;
  type: string;
  default?: string | undefined;
  description: string;
}

type FilterMeta = {
  label: string;
  name: string;
  description: ReactNode;
  paramsSchema: ParamsProperty[];
}

export default function Selection() {
  const [paramsForm] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [options, setOptions] = useState<FilterMeta[]>([]);

  useEffect(() => {
    Api.Selection.filters().then(data => {
      data.map((item: any) => {
        item.description = parse(item.description.replaceAll('\n', '<br/>'))
        item.paramsSchema = item.params_schema || []
        return item
      })
      setOptions(data)
    })
  }, [])

  const [selectedFilters, setSelectedFilters] = useState<(string | number | LabeledValue)[]>([]);

  const onSelect = async () => {
    // await Api.Selection.select()
  }

  const SearchForm: () => ReactNode = () => {
    const beforeTag = (
      <Text style={{ width: 60 }} >
        筛选器
      </Text>
    )
    return (
      <Form layout='inline' style={{padding: 5, borderRadius: '4px'}} form={searchForm}>
        <FormItem >
          <Select
            placeholder='filters'
            style={{ width: 800 }}
            mode='multiple'
            maxTagCount={3}
            addBefore={beforeTag}
            showSearch
            allowClear
            onSelect={(value) => setSelectedFilters([...selectedFilters, value])}
            onDeselect={(value) => setSelectedFilters(selectedFilters.filter((item) => item !== value))}
            onClear={() => setSelectedFilters([])}
          >
            {options.map((option, index) => (
              <Select.Option key={option.name} value={option.name}>
                <Tooltip content={option.description} position='right' style={{width: '100%'}}>
                  <Text style={{ margin: 10 }} >
                    {option.label}
                  </Text>
                </Tooltip>
              </Select.Option>
            ))}
          </Select>
        </FormItem>
        <FormItem >
          <RadioGroup
            type='button'
            name='type'
            defaultValue='all'
          >
            <Radio value='all'>全部</Radio>
            <Radio value='optional'>自选</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem>
          <Button type='primary' onClick={onSelect}>筛选</Button>
        </FormItem>
      </Form>
    )
  }

  const filterParamsForms: () => ReactNode = () => {
    const filterMapping: Map<string | number | LabeledValue, FilterMeta> = new Map(options.map(meta => {
      return [meta.name, meta]
    }))

    const filterCollapseItem: (filter: FilterMeta | undefined, index: number) => ReactNode = (filter, index) => {
      if (!filter) {
        return null;
      }
      return (
        <Collapse.Item key={index} header={filter.label} name={filter.label} className='filter-collapse-content-box'>
          <Layout>
            <Layout.Sider style={{
              textAlign: 'left',
              width: '40%',
            }}>
              {filter.description}
            </Layout.Sider>
            <Layout.Content style={{textAlign: 'left', borderLeft: '1px solid #e5e5e5'}}>
              <Form layout='horizontal' className='filter-params-form'>
                {filter.paramsSchema.map((param, index) => (
                  <FormItem key={param.name}
                            label={param.name}
                            field={param.name}
                            labelCol={{span: 7}}
                            wrapperCol={{span: 16}}
                            initialValue={param.default}
                  >
                      <Input style={{width: 150}} />
                      <span style={{marginLeft: 20, width: 100}}>
                        {param.description}
                      </span>
                  </FormItem>
                ))}
              </Form>
            </Layout.Content>
          </Layout>
        </Collapse.Item>
      )
    }

    return (
      <Collapse accordion style={{width: '1020px', margin: '0px 5px'}}>
        {selectedFilters.map((item, index) => filterCollapseItem(filterMapping.get(item), index))}
      </Collapse>
    )
  }

  return (
    <div>
      <div>
        {SearchForm()}
        {filterParamsForms()}
      </div>
      <div>

      </div>
    </div>
  )
}